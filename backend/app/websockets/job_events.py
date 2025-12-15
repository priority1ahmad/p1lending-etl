"""
WebSocket handlers for real-time job updates
"""

import socketio
import asyncio
import json
from typing import Dict, Any, List
from app.core.logger import etl_logger
from app.core.config import settings
from app.core.security import decode_token

# Allowed origins for WebSocket CORS - restrict to known domains
WEBSOCKET_ALLOWED_ORIGINS: List[str] = [
    "https://staging.etl.p1lending.io",
    "https://etl.p1lending.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Create Socket.io server with restricted CORS
sio = socketio.AsyncServer(cors_allowed_origins=WEBSOCKET_ALLOWED_ORIGINS, async_mode="asgi")

# Socket.io app
socketio_app = socketio.ASGIApp(sio)

# Global reference for emitting events from Celery tasks
_sio_instance = None

# Background task for Redis subscription
_redis_subscriber_task = None


def get_sio_instance():
    """Get Socket.io instance for use in Celery tasks"""
    global _sio_instance
    if _sio_instance is None:
        # Create a synchronous socketio server for Celery tasks
        _sio_instance = socketio.Server(cors_allowed_origins=WEBSOCKET_ALLOWED_ORIGINS)
    return _sio_instance


@sio.event
async def connect(sid, environ, auth=None):
    """
    Handle client connection with JWT authentication.

    Clients must provide a valid JWT token either:
    - In the 'auth' parameter: { token: 'jwt_token_here' }
    - In the Authorization header: 'Bearer jwt_token_here'
    """
    token = None

    # Try auth parameter first (Socket.IO auth option)
    if auth and isinstance(auth, dict):
        token = auth.get('token')

    # Fallback to Authorization header
    if not token:
        # Get headers from WSGI environ
        auth_header = environ.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

    # Validate token
    if not token:
        etl_logger.warning(f"WebSocket connection rejected: No token provided (sid: {sid})")
        raise ConnectionRefusedError("Authentication required")

    payload = decode_token(token)
    if not payload:
        etl_logger.warning(f"WebSocket connection rejected: Invalid token (sid: {sid})")
        raise ConnectionRefusedError("Invalid or expired token")

    user_id = payload.get('sub')
    if not user_id:
        etl_logger.warning(f"WebSocket connection rejected: Missing user ID in token (sid: {sid})")
        raise ConnectionRefusedError("Invalid token format")

    # Store user info in session for later use
    await sio.save_session(sid, {'user_id': user_id})
    etl_logger.info(f"Authenticated WebSocket client connected: {sid} (user: {user_id})")


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    session = await sio.get_session(sid)
    user_id = session.get('user_id', 'unknown') if session else 'unknown'
    etl_logger.info(f"Client disconnected: {sid} (user: {user_id})")


@sio.event
async def join_job(sid, data: Dict[str, Any]):
    """
    Join a job room to receive updates
    
    Args:
        sid: Socket session ID
        data: Dictionary with 'job_id' key
    """
    job_id = data.get('job_id')
    if job_id:
        room = f"job_{job_id}"
        sio.enter_room(sid, room)
        etl_logger.info(f"Client {sid} joined job room: {room}")
        await sio.emit('joined_job', {'job_id': job_id}, room=sid)


@sio.event
async def leave_job(sid, data: Dict[str, Any]):
    """
    Leave a job room
    
    Args:
        sid: Socket session ID
        data: Dictionary with 'job_id' key
    """
    job_id = data.get('job_id')
    if job_id:
        room = f"job_{job_id}"
        sio.leave_room(sid, room)
        etl_logger.info(f"Client {sid} left job room: {room}")
        await sio.emit('left_job', {'job_id': job_id}, room=sid)


async def emit_job_progress(job_id: str, progress: int, message: str):
    """Emit job progress update"""
    await sio.emit('job_progress', {
        'job_id': job_id,
        'progress': progress,
        'message': message
    }, room=f"job_{job_id}")


async def emit_job_log(job_id: str, level: str, message: str):
    """Emit job log entry"""
    await sio.emit('job_log', {
        'job_id': job_id,
        'level': level,
        'message': message,
        'timestamp': None  # Will be set by client
    }, room=f"job_{job_id}")


async def emit_job_complete(job_id: str, data: Dict[str, Any]):
    """Emit job completion event"""
    await sio.emit('job_complete', {
        'job_id': job_id,
        **data
    }, room=f"job_{job_id}")


async def emit_job_error(job_id: str, error: str):
    """Emit job error event"""
    await sio.emit('job_error', {
        'job_id': job_id,
        'error': error
    }, room=f"job_{job_id}")


async def emit_row_processed(job_id: str, row_data: Dict[str, Any]):
    """Emit row processed event"""
    await sio.emit('row_processed', {
        'job_id': job_id,
        **row_data
    }, room=f"job_{job_id}")


async def emit_batch_progress(job_id: str, batch_data: Dict[str, Any]):
    """Emit batch progress event"""
    await sio.emit('batch_progress', {
        'job_id': job_id,
        **batch_data
    }, room=f"job_{job_id}")


async def start_redis_subscriber():
    """Start Redis subscriber to bridge pub/sub to WebSocket"""
    try:
        # Try async redis first
        try:
            import redis.asyncio as aioredis
            use_async = True
        except ImportError:
            use_async = False
            etl_logger.warning("redis.asyncio not available, using sync redis with threading")
        
        if use_async:
            r = aioredis.from_url(settings.redis_url, decode_responses=True)
            pubsub = r.pubsub()
            
            # Subscribe to all job channels
            await pubsub.psubscribe("job_*")
            
            etl_logger.info("Redis subscriber started for WebSocket bridge (async)")
            
            async for message in pubsub.listen():
                if message['type'] == 'pmessage':
                    channel = message['channel']
                    job_id = channel.replace('job_', '')
                    data_str = message['data']
                    
                    try:
                        # Parse JSON message
                        message_data = json.loads(data_str)
                        event_type = message_data.get('event_type')
                        data = message_data.get('data', {})
                        
                        # Emit via WebSocket
                        if event_type == 'job_progress':
                            await sio.emit('job_progress', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                            # Trigger NTFY for milestone progress (20%, 40%, 60%, 80%)
                            progress = data.get('progress', 0)
                            if progress in [20, 40, 60, 80]:
                                await _trigger_ntfy_progress(job_id, data)
                        elif event_type == 'job_log':
                            await sio.emit('job_log', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                        elif event_type == 'job_complete':
                            await sio.emit('job_complete', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                            # Trigger NTFY for job completion
                            await _trigger_ntfy_complete(job_id, data)
                        elif event_type == 'job_error':
                            await sio.emit('job_error', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                            # Trigger NTFY for job error (urgent)
                            await _trigger_ntfy_error(job_id, data)
                        elif event_type == 'batch_progress':
                            await sio.emit('batch_progress', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                        elif event_type == 'row_processed':
                            await sio.emit('row_processed', {
                                'job_id': job_id,
                                **data
                            }, room=f"job_{job_id}")
                    except json.JSONDecodeError:
                        # Fallback for old format
                        try:
                            if ':' in data_str:
                                event_type, data_json = data_str.split(':', 1)
                                data = json.loads(data_json)
                                await sio.emit(event_type, {
                                    'job_id': job_id,
                                    **data
                                }, room=f"job_{job_id}")
                        except Exception as e:
                            etl_logger.error(f"Error parsing fallback format: {e}")
                    except Exception as e:
                        etl_logger.error(f"Error processing Redis message: {e}")
        else:
            # Use sync redis with threading and asyncio bridge
            import redis
            import threading
            import asyncio
            
            def redis_listener():
                try:
                    r = redis.from_url(settings.redis_url, decode_responses=True)
                    pubsub = r.pubsub()
                    pubsub.psubscribe("job_*")
                    
                    etl_logger.info("Redis subscriber started for WebSocket bridge (sync)")
                    
                    # Get the event loop for this thread
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    for message in pubsub.listen():
                        if message['type'] == 'pmessage':
                            channel = message['channel']
                            job_id = channel.replace('job_', '')
                            data_str = message['data']
                            
                            try:
                                message_data = json.loads(data_str)
                                event_type = message_data.get('event_type')
                                data = message_data.get('data', {})
                                
                                # Emit via WebSocket using the async function
                                async def emit_event():
                                    if event_type == 'job_progress':
                                        await sio.emit('job_progress', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                    elif event_type == 'job_log':
                                        await sio.emit('job_log', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                    elif event_type == 'job_complete':
                                        await sio.emit('job_complete', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                    elif event_type == 'job_error':
                                        await sio.emit('job_error', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                    elif event_type == 'batch_progress':
                                        await sio.emit('batch_progress', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                    elif event_type == 'row_processed':
                                        await sio.emit('row_processed', {
                                            'job_id': job_id,
                                            **data
                                        }, room=f"job_{job_id}")
                                
                                # Run the async function in the loop
                                loop.run_until_complete(emit_event())
                            except Exception as e:
                                etl_logger.error(f"Error in sync Redis listener: {e}")
                except Exception as e:
                    etl_logger.error(f"Redis listener thread error: {e}")
            
            thread = threading.Thread(target=redis_listener, daemon=True)
            thread.start()
            # Keep the function running but don't block
            try:
                while True:
                    await asyncio.sleep(3600)  # Sleep for 1 hour, check periodically
            except asyncio.CancelledError:
                pass
                    
    except Exception as e:
        etl_logger.error(f"Redis subscriber error: {e}")
        # Don't raise, just log - the app should still work without real-time updates


async def _trigger_ntfy_progress(job_id: str, data: Dict[str, Any]) -> None:
    """Trigger NTFY notification for job progress milestones."""
    try:
        from app.services.ntfy_service import get_ntfy_events

        ntfy_events = get_ntfy_events()
        progress = data.get('progress', 0)
        current_row = data.get('current_row', 0)
        total_rows = data.get('total_rows', 0)
        script_name = data.get('message', '').split(' - ')[0] if ' - ' in data.get('message', '') else ''

        # Use async version
        await ntfy_events.ntfy.send(
            topic=ntfy_events.topics.topic_jobs,
            message=(
                f"**ETL Job {progress}% Complete**\n\n"
                f"Job ID: `{job_id}`\n"
                f"Progress: {current_row:,} / {total_rows:,} rows"
            ),
            title=f"Job Progress: {progress}%",
            tags=["chart_with_upwards_trend", "progress"],
        )
    except Exception as e:
        etl_logger.warning(f"Failed to send NTFY progress notification: {e}")


async def _trigger_ntfy_complete(job_id: str, data: Dict[str, Any]) -> None:
    """Trigger NTFY notification for job completion."""
    try:
        from app.services.ntfy_service import get_ntfy_events

        ntfy_events = get_ntfy_events()
        total_rows = data.get('total_rows_processed', data.get('total_rows', 0))
        clean_count = data.get('clean_count', 0)
        litigator_count = data.get('litigator_count', 0)
        dnc_count = data.get('dnc_count', 0)

        await ntfy_events.ntfy.send(
            topic=ntfy_events.topics.topic_jobs,
            message=(
                f"**ETL Job Completed**\n\n"
                f"Job ID: `{job_id}`\n\n"
                f"**Results:**\n"
                f"- Total: {total_rows:,}\n"
                f"- Clean: {clean_count:,}\n"
                f"- Litigators: {litigator_count:,}\n"
                f"- DNC: {dnc_count:,}"
            ),
            title="Job Completed",
            tags=["white_check_mark", "success"],
        )
    except Exception as e:
        etl_logger.warning(f"Failed to send NTFY completion notification: {e}")


async def _trigger_ntfy_error(job_id: str, data: Dict[str, Any]) -> None:
    """Trigger NTFY notification for job error (urgent priority)."""
    try:
        from app.services.ntfy_service import get_ntfy_events, NtfyPriority

        ntfy_events = get_ntfy_events()
        error_message = data.get('error', 'Unknown error')

        await ntfy_events.ntfy.send(
            topic=ntfy_events.topics.topic_errors,
            message=(
                f"**ETL Job FAILED**\n\n"
                f"Job ID: `{job_id}`\n"
                f"Error: {error_message[:500]}"
            ),
            title="JOB FAILED",
            priority=NtfyPriority.URGENT,
            tags=["x", "error", "urgent"],
        )
    except Exception as e:
        etl_logger.warning(f"Failed to send NTFY error notification: {e}")
