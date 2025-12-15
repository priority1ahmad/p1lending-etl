/**
 * useJobSocket Hook
 * Handles WebSocket connection for real-time job updates
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ETLJob } from '../../services/api/jobs';
import type { ProcessedRow } from '../../components/features/etl';

export interface JobProgressData {
  progress?: number;
  message?: string;
  current_row?: number;
  total_rows?: number;
  rows_remaining?: number;
  current_batch?: number;
  total_batches?: number;
}

export interface BatchProgressData {
  current_batch: number;
  total_batches: number;
  message?: string;
}

export interface RowProcessedData {
  row_data?: {
    row_number?: number;
    first_name?: string;
    last_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone_1?: string;
    phone_2?: string;
    phone_3?: string;
    email_1?: string;
    email_2?: string;
    email_3?: string;
    in_litigator_list?: string;
    phone_1_in_dnc?: string;
    phone_2_in_dnc?: string;
    phone_3_in_dnc?: string;
    status?: string;
  };
  batch?: number;
}

export interface LogData {
  level?: string;
  message: string;
}

export interface UseJobSocketOptions {
  /** Current job to subscribe to */
  job: ETLJob | null;
  /** Callback for job progress updates */
  onProgress?: (data: JobProgressData) => void;
  /** Callback for batch progress updates */
  onBatchProgress?: (data: BatchProgressData) => void;
  /** Callback for row processed events */
  onRowProcessed?: (data: RowProcessedData) => void;
  /** Callback for log events */
  onLog?: (data: LogData) => void;
  /** Callback for job completion */
  onComplete?: (data: Partial<ETLJob>) => void;
  /** Callback for job error */
  onError?: (data: { error: string }) => void;
}

export function useJobSocket({
  job,
  onProgress,
  onBatchProgress,
  onRowProcessed,
  onLog,
  onComplete,
  onError,
}: UseJobSocketOptions): void {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if we have a running job
    if (!job || job.status !== 'running') {
      return;
    }

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    // Determine socket URL
    // In production, use relative URL so nginx can proxy socket.io
    // In development, use explicit localhost URL
    const socketUrl =
      import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : undefined);

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      socket.emit('join_job', { job_id: job.id });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('job_progress', (data: JobProgressData) => {
      onProgress?.(data);
    });

    socket.on('batch_progress', (data: BatchProgressData) => {
      onBatchProgress?.(data);
    });

    socket.on('row_processed', (data: RowProcessedData) => {
      onRowProcessed?.(data);
    });

    socket.on('job_log', (data: LogData) => {
      onLog?.(data);
    });

    socket.on('job_complete', (data: Partial<ETLJob>) => {
      onComplete?.(data);
    });

    socket.on('job_error', (data: { error: string }) => {
      onError?.(data);
    });

    socketRef.current = socket;

    // Cleanup
    return () => {
      socket.emit('leave_job', { job_id: job.id });
      socket.disconnect();
    };
  }, [job?.id, job?.status, onProgress, onBatchProgress, onRowProcessed, onLog, onComplete, onError]);
}

/**
 * Helper function to convert row_processed data to ProcessedRow format
 */
export function toProcessedRow(
  data: RowProcessedData,
  currentRowCount: number
): ProcessedRow {
  const rowData = data.row_data || {};
  return {
    row_number: rowData.row_number || currentRowCount + 1,
    first_name: rowData.first_name || '',
    last_name: rowData.last_name || '',
    address: rowData.address || '',
    city: rowData.city || '',
    state: rowData.state || '',
    zip_code: rowData.zip_code || '',
    phone_1: rowData.phone_1 || '',
    phone_2: rowData.phone_2 || '',
    phone_3: rowData.phone_3 || '',
    email_1: rowData.email_1 || '',
    email_2: rowData.email_2 || '',
    email_3: rowData.email_3 || '',
    in_litigator_list: rowData.in_litigator_list || 'No',
    phone_1_in_dnc: rowData.phone_1_in_dnc || 'No',
    phone_2_in_dnc: rowData.phone_2_in_dnc || 'No',
    phone_3_in_dnc: rowData.phone_3_in_dnc || 'No',
    status: rowData.status || 'Processing',
    batch: data.batch,
  };
}

export default useJobSocket;
