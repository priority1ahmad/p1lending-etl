/**
 * Socket Event Types
 * Type definitions for WebSocket/Socket.IO events
 */

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

export interface JobLogData {
  level?: string;
  message: string;
  timestamp?: string;
}

export interface JobCompleteData {
  job_id?: string;
  status?: string;
  progress?: number;
  [key: string]: unknown;
}

export interface JobErrorData {
  error: string;
  job_id?: string;
}
