/**
 * Lodasoft CRM Import API Service
 *
 * Handles importing ETL job results to Lodasoft CRM system
 * Backend endpoints: /api/v1/crm-import/*
 */

import apiClient from '../../utils/api';

export type ImportStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface ImportLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}

export interface CRMImportRequest {
  job_id?: string;
  job_name?: string;
  record_ids?: string[];
}

export interface CRMImportStartResponse {
  import_id: string;
  status: string;
  message: string;
  total_records: number;
}

export interface CRMImportProgress {
  import_id: string;
  status: ImportStatus;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  merged_records: number;
  duplicate_records: number;
  current_batch: number;
  total_batches: number;
  progress_percent: number;
  logs: string[];
  error_message?: string;
}

export interface CRMImportHistoryItem {
  id: string;
  job_id?: string;
  job_name?: string;
  status: ImportStatus;
  total_records: number;
  successful_records: number;
  failed_records: number;
  merged_records: number;
  duplicate_records: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CRMImportHistoryResponse {
  items: CRMImportHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CRMConnectionStatus {
  success: boolean;
  message: string;
  auth_url?: string;
  upload_url?: string;
}

// Alias types for backwards compatibility with components
export interface ImportRecord {
  import_id: string;
  job_id: string;
  job_name: string;
  status: ImportStatus;
  total_records: number;
  records_imported: number;
  records_failed: number;
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

// Transform backend response to component-expected format
function transformHistoryItem(item: CRMImportHistoryItem): ImportRecord {
  return {
    import_id: item.id,
    job_id: item.job_id || '',
    job_name: item.job_name || 'Unknown Job',
    status: item.status,
    total_records: item.total_records,
    records_imported: item.successful_records,
    records_failed: item.failed_records,
    progress: item.total_records > 0
      ? Math.round((item.successful_records + item.failed_records) / item.total_records * 100)
      : 0,
    started_at: item.started_at || item.created_at,
    completed_at: item.completed_at,
    error_message: item.error_message,
    created_at: item.created_at,
  };
}

export const lodasoftImportApi = {
  /**
   * Start a CRM import for a job
   */
  startImport: async (jobId: string, jobName?: string): Promise<CRMImportStartResponse> => {
    const response = await apiClient.post<CRMImportStartResponse>(
      '/crm-import/start',
      {
        job_id: jobId,
        job_name: jobName,
      }
    );
    return response.data;
  },

  /**
   * Get the current status of an import
   */
  getImportStatus: async (importId: string): Promise<CRMImportProgress> => {
    const response = await apiClient.get<CRMImportProgress>(
      `/crm-import/status/${importId}`
    );
    return response.data;
  },

  /**
   * Get paginated import history
   */
  getImportHistory: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ imports: ImportRecord[]; total: number }> => {
    const response = await apiClient.get<CRMImportHistoryResponse>(
      `/crm-import/history?page=${page}&page_size=${pageSize}`
    );
    return {
      imports: response.data.items.map(transformHistoryItem),
      total: response.data.total,
    };
  },

  /**
   * Test connection to Lodasoft CRM API
   */
  testConnection: async (): Promise<CRMConnectionStatus> => {
    const response = await apiClient.get<CRMConnectionStatus>('/crm-import/test-connection');
    return response.data;
  },

  /**
   * Cancel an ongoing import
   */
  cancelImport: async (importId: string): Promise<{ message: string; import_id: string }> => {
    const response = await apiClient.post<{ message: string; import_id: string }>(
      `/crm-import/cancel/${importId}`
    );
    return response.data;
  },
};

export default lodasoftImportApi;
