/**
 * ETL Results API Service
 *
 * Handles fetching and exporting ETL job results from Snowflake MASTER_PROCESSED_DB
 */

import apiClient from '../../utils/api';

export interface ETLResultRecord {
  record_id: string;
  job_id: string;
  job_name: string;
  processed_at: string;
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
  additional_data?: any;
}

export interface ETLJob {
  job_id: string;
  job_name: string;
  record_count: number;
  litigator_count: number;
  last_processed: string;
}

export interface ResultsResponse {
  records: ETLResultRecord[];
  total: number;
  offset: number;
  limit: number;
  litigator_count?: number;
}

export interface ResultsStats {
  total_jobs: number;
  total_records: number;
  total_litigators: number;
  clean_records: number;
  litigator_percentage: number;
}

export const resultsApi = {
  /**
   * List all jobs that have results
   */
  listJobs: async (limit: number = 50): Promise<{ jobs: ETLJob[]; total: number; message: string }> => {
    const response = await apiClient.get<{ jobs: ETLJob[]; total: number; message: string }>(
      `/results/jobs?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get paginated results for a specific job
   */
  getJobResults: async (
    jobId: string,
    offset: number = 0,
    limit: number = 100,
    excludeLitigators: boolean = false
  ): Promise<ResultsResponse> => {
    const response = await apiClient.get<ResultsResponse>(
      `/results/job/${jobId}?offset=${offset}&limit=${limit}&exclude_litigators=${excludeLitigators}`
    );
    return response.data;
  },

  /**
   * Get results by job name
   */
  getResultsByName: async (
    jobName: string,
    offset: number = 0,
    limit: number = 100,
    excludeLitigators: boolean = false
  ): Promise<ResultsResponse> => {
    const response = await apiClient.get<ResultsResponse>(
      `/results/by-name/${encodeURIComponent(jobName)}?offset=${offset}&limit=${limit}&exclude_litigators=${excludeLitigators}`
    );
    return response.data;
  },

  /**
   * Export job results as CSV (triggers download)
   */
  exportJobResults: async (jobId: string, excludeLitigators: boolean = false): Promise<void> => {
    const response = await apiClient.get(
      `/results/export/${jobId}?exclude_litigators=${excludeLitigators}`,
      { responseType: 'blob' }
    );

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `etl_results_${jobId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export results by job name as CSV
   */
  exportResultsByName: async (jobName: string, excludeLitigators: boolean = false): Promise<void> => {
    const response = await apiClient.get(
      `/results/export-by-name/${encodeURIComponent(jobName)}?exclude_litigators=${excludeLitigators}`,
      { responseType: 'blob' }
    );

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    const safeJobName = jobName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    let filename = `etl_results_${safeJobName}_${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete job results (superuser only)
   */
  deleteJobResults: async (jobId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/results/job/${jobId}`);
    return response.data;
  },

  /**
   * Get overall statistics for ETL results
   */
  getStats: async (): Promise<ResultsStats> => {
    const response = await apiClient.get<ResultsStats>('/results/stats');
    return response.data;
  },
};
