"""
Logging utilities for the ETL system (adapted for FastAPI)
"""

import logging
import sys
from typing import Optional, Callable
from datetime import datetime
from pathlib import Path
from app.core.config import settings


class ETLLogger:
    """Centralized logging for ETL operations"""
    
    def __init__(self, name: str = "ETL", level: Optional[str] = None, log_file: Optional[str] = None):
        """
        Initialize ETL logger
        
        Args:
            name: Logger name
            level: Logging level (defaults to settings.etl.log_level)
            log_file: Optional log file path
        """
        self.logger = logging.getLogger(name)
        log_level = level or settings.etl.log_level
        self.logger.setLevel(getattr(logging, log_level.upper()))
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Create formatters
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler (if specified)
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def info(self, message: str):
        """Log info message"""
        self.logger.info(message)
    
    def error(self, message: str):
        """Log error message"""
        self.logger.error(message)
    
    def warning(self, message: str):
        """Log warning message"""
        self.logger.warning(message)
    
    def debug(self, message: str):
        """Log debug message"""
        self.logger.debug(message)
    
    def critical(self, message: str):
        """Log critical message"""
        self.logger.critical(message)


class JobLogger:
    """Logger for specific ETL jobs with job tracking"""
    
    def __init__(self, job_name: str, base_logger: ETLLogger, job_id: Optional[str] = None, log_callback: Optional[Callable] = None):
        """
        Initialize job logger
        
        Args:
            job_name: Name of the ETL job
            base_logger: Base ETL logger instance
            job_id: Optional job ID for WebSocket logging
            log_callback: Optional callback function to emit logs via WebSocket
        """
        self.job_name = job_name
        self.logger = base_logger.logger.getChild(job_name)
        self.start_time = None
        self.end_time = None
        self.job_id = job_id
        self.log_callback = log_callback
        
        # Set up file logging for this job if job_id is provided
        if job_id:
            log_dir = Path("backend/logs/jobs")
            log_dir.mkdir(parents=True, exist_ok=True)
            log_file = log_dir / f"{job_id}.log"
            
            # Add file handler for this job
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def start_job(self):
        """Log job start"""
        self.start_time = datetime.now()
        self.logger.info(f"🚀 Starting ETL job: {self.job_name}")
    
    def end_job(self, success: bool = True):
        """Log job end"""
        self.end_time = datetime.now()
        duration = self.end_time - self.start_time if self.start_time else None
        
        if success:
            self.logger.info(f"✅ Completed ETL job: {self.job_name}")
        else:
            self.logger.error(f"❌ Failed ETL job: {self.job_name}")
        
        if duration:
            self.logger.info(f"⏱️  Job duration: {duration}")
    
    def log_step(self, step_name: str, message: str = ""):
        """Log a step within the job"""
        step_msg = f"📋 {step_name}"
        if message:
            step_msg += f": {message}"
        self.logger.info(step_msg)
        # Emit via WebSocket if callback provided
        if self.log_callback:
            self.log_callback("INFO", step_msg)
    
    def log_data_stats(self, rows: int, columns: int = None):
        """Log data statistics"""
        stats_msg = f"📊 Data processed: {rows:,} rows"
        if columns:
            stats_msg += f", {columns} columns"
        self.logger.info(stats_msg)
        # Emit via WebSocket if callback provided
        if self.log_callback:
            self.log_callback("INFO", stats_msg)
    
    def log_error(self, error: Exception, context: str = ""):
        """Log error with context"""
        error_msg = f"❌ Error in {context}: {str(error)}" if context else f"❌ Error: {str(error)}"
        self.logger.error(error_msg)
        # Emit via WebSocket if callback provided
        if self.log_callback:
            self.log_callback("ERROR", error_msg)
    
    def info(self, message: str):
        """Log info message"""
        self.logger.info(message)
        if self.log_callback:
            self.log_callback("INFO", message)
    
    def warning(self, message: str):
        """Log warning message"""
        self.logger.warning(message)
        if self.log_callback:
            self.log_callback("WARNING", message)
    
    def error(self, message: str):
        """Log error message"""
        self.logger.error(message)
        if self.log_callback:
            self.log_callback("ERROR", message)


# Global logger instance
etl_logger = ETLLogger()

