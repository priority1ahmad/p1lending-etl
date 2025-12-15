---
paths: backend/app/websockets/**/*.py, frontend/src/**/*socket*.ts, frontend/src/**/*Socket*.tsx
---

# WebSocket Rules

## Backend (Python Socket.IO)

### Event Handler Structure
```python
from socketio import AsyncServer

sio = AsyncServer(async_mode='asgi', cors_allowed_origins=[])

@sio.event
async def connect(sid, environ):
    """Handle new connection."""
    # TODO: Add authentication
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handle disconnection."""
    print(f"Client disconnected: {sid}")

@sio.event
async def join_job(sid, data):
    """Join a job room for updates."""
    job_id = data.get('job_id')
    if job_id:
        sio.enter_room(sid, f"job_{job_id}")
        await sio.emit('joined', {'job_id': job_id}, room=sid)

@sio.event
async def leave_job(sid, data):
    """Leave a job room."""
    job_id = data.get('job_id')
    if job_id:
        sio.leave_room(sid, f"job_{job_id}")
```

### Emitting Events
```python
# To specific room (job subscribers)
async def emit_job_progress(job_id: str, data: dict):
    await sio.emit('job_progress', data, room=f"job_{job_id}")

# To specific client
async def emit_to_client(sid: str, event: str, data: dict):
    await sio.emit(event, data, room=sid)

# Broadcast to all
async def broadcast(event: str, data: dict):
    await sio.emit(event, data)
```

### Redis Pub/Sub for Multi-Worker
```python
import redis.asyncio as redis

class WebSocketManager:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)
        self.pubsub = self.redis.pubsub()

    async def publish(self, channel: str, message: dict):
        await self.redis.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str):
        await self.pubsub.subscribe(channel)
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                yield json.loads(message['data'])
```

## Frontend (Socket.IO Client)

### Connection Setup
```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(API_URL, {
  autoConnect: false,
  transports: ['websocket'],
  auth: {
    token: getAuthToken(),
  },
});

// Connect with auth
socket.auth = { token: getAuthToken() };
socket.connect();

// Disconnect cleanup
socket.disconnect();
```

### Event Listeners
```typescript
// Subscribe to events
socket.on('job_progress', (data: JobProgress) => {
  console.log('Progress:', data.percentage);
  updateProgress(data);
});

socket.on('job_complete', (data: JobResult) => {
  showSuccess('Job completed!');
  refreshData();
});

socket.on('job_error', (data: JobError) => {
  showError(data.message);
});

// Cleanup on unmount
return () => {
  socket.off('job_progress');
  socket.off('job_complete');
  socket.off('job_error');
};
```

### React Hook Pattern
```typescript
function useJobSocket(jobId: string) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');

  useEffect(() => {
    if (!jobId) return;

    socket.emit('join_job', { job_id: jobId });

    const handleProgress = (data: JobProgress) => {
      setProgress(data.percentage);
      setStatus('running');
    };

    const handleComplete = () => {
      setStatus('complete');
    };

    socket.on('job_progress', handleProgress);
    socket.on('job_complete', handleComplete);

    return () => {
      socket.emit('leave_job', { job_id: jobId });
      socket.off('job_progress', handleProgress);
      socket.off('job_complete', handleComplete);
    };
  }, [jobId]);

  return { progress, status };
}
```

## Event Types

### Standard Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `connect` | Client → Server | - |
| `disconnect` | Client → Server | - |
| `join_job` | Client → Server | `{ job_id: string }` |
| `leave_job` | Client → Server | `{ job_id: string }` |
| `job_progress` | Server → Client | `{ job_id, percentage, message }` |
| `job_log` | Server → Client | `{ job_id, level, message, timestamp }` |
| `job_complete` | Server → Client | `{ job_id, result }` |
| `job_error` | Server → Client | `{ job_id, error, message }` |

## Examples in Codebase
- Server setup: `backend/app/websockets/job_events.py`
- Main integration: `backend/app/main.py`

## NEVER DO
- Use WebSocket without authentication in production
- Store sensitive data in WebSocket messages
- Create connections without cleanup
- Use wildcard CORS (`*`) in production

## ALWAYS DO
- Authenticate WebSocket connections
- Use rooms for job-specific updates
- Clean up listeners on unmount
- Handle reconnection gracefully
- Log connection/disconnection events
