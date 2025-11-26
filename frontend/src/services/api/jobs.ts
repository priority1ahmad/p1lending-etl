import apiClient from '../../utils/api';

export interface ETLJob {
  id: string;
  job_type: 'single_script' | 'all_scripts' | 'preview';
  script_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  row_limit?: number;
  total_rows_processed: number;
  litigator_count: number;
  dnc_count: number;
  both_count: number;
  clean_count: number;
  error_message?: string;
  preview_data?: {
    script_name: string;
    row_count: number;
    rows?: Array<Record<string, any>>;
  };
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // Detailed progress fields
  current_row?: number;
  total_rows?: number;
  rows_remaining?: number;
  current_batch?: number;
  total_batches?: number;
}

export interface JobsListResponse {
  jobs: ETLJob[];
  message?: string;
  max_records: number;
}

export interface JobCreate {
  script_id?: string;
  script_content?: string;
  script_name?: string;
  job_type: 'single_script' | 'all_scripts';
  row_limit?: number;
}

export interface JobPreview {
  script_name: string;
  row_count: number;
  rows?: Array<Record<string, any>>;
}

export const jobsApi = {
  list: async (skip = 0, limit = 50, status?: string): Promise<JobsListResponse> => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(Math.min(limit, 50)) });
    if (status) params.append('status_filter', status);
    const response = await apiClient.get<JobsListResponse>(`/jobs?${params}`);
    return response.data;
  },

  get: async (id: string): Promise<ETLJob> => {
    const response = await apiClient.get<ETLJob>(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: JobCreate): Promise<ETLJob> => {
    const response = await apiClient.post<ETLJob>('/jobs', data);
    return response.data;
  },

  cancel: async (id: string): Promise<ETLJob> => {
    const response = await apiClient.post<ETLJob>(`/jobs/${id}/cancel`);
    return response.data;
  },

  getLogs: async (id: string, skip = 0, limit = 1000): Promise<any[]> => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    const response = await apiClient.get<any[]>(`/jobs/${id}/logs?${params}`);
    return response.data;
  },

  preview: async (scriptIds: string[], rowLimit?: number): Promise<JobPreview[]> => {
    const params = new URLSearchParams();
    if (rowLimit) {
      params.append('row_limit', String(rowLimit));
    }
    const url = `/jobs/preview${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.post<JobPreview[]>(url, scriptIds);
    return response.data;
  },

  getStats: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/jobs/${id}/stats`);
    return response.data;
  },

  getLogFile: async (id: string): Promise<{ job_id: string; content: string; exists: boolean; size?: number; lines?: number }> => {
    const response = await apiClient.get<{ job_id: string; content: string; exists: boolean; size?: number; lines?: number }>(`/jobs/${id}/logfile`);
    return response.data;
  },
};

