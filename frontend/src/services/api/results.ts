/**
 * ETL Results API Service
 *
 * Handles fetching and exporting ETL job results from Snowflake MASTER_PROCESSED_DB
 */

import apiClient from '../../utils/api';

export interface ETLResultRecord {
  // Metadata
  record_id: string;
  job_id: string;
  job_name: string;
  table_id?: string;
  table_title?: string;
  processed_at: string;

  // Lead Information
  lead_number?: string;
  campaign_date?: string;
  lead_campaign?: string;
  lead_source?: string;
  ref_id?: string;

  // Person Data
  first_name?: string;
  last_name?: string;
  co_borrower_full_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Property Data
  total_units?: string;
  owner_occupied?: string;
  annual_tax_amount?: string;
  assessed_value?: string;
  estimated_value?: string;

  // First Mortgage
  ltv?: string;
  loan_type?: string;
  first_mortgage_type?: string;
  first_mortgage_amount?: string;
  first_mortgage_balance?: string;
  term?: string;
  estimated_new_payment?: string;

  // Second Mortgage
  second_mortgage_type?: string;
  second_mortgage_term?: string;
  second_mortgage_balance?: string;
  has_second_mortgage?: string;

  // Current Loan Details
  current_interest_rate?: string;
  current_lender?: string;
  arm_index_type?: string;
  origination_date?: string;
  rate_adjustment_date?: string;

  // Phone Data
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;

  // Email Data
  email_1?: string;
  email_2?: string;
  email_3?: string;

  // Compliance Flags
  in_litigator_list?: string;
  phone_1_in_dnc?: string;
  phone_2_in_dnc?: string;
  phone_3_in_dnc?: string;
}

export interface ETLJob {
  job_id: string;
  job_name: string;
  record_count: number;
  litigator_count: number;
  dnc_count: number;
  both_count: number;
  last_processed: string;
  table_id?: string;
  table_title?: string;
}

export interface CachedTable {
  table_id: string;
  job_id: string;
  total_records: number;
  litigator_count: number;
  cached_at: string;
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

  // =====================
  // Table ID Methods
  // =====================

  /**
   * Get results by table_id with optional caching
   */
  getResultsByTableId: async (
    tableId: string,
    offset: number = 0,
    limit: number = 100,
    excludeLitigators: boolean = false,
    useCache: boolean = true
  ): Promise<ResultsResponse & { cached?: boolean; cached_at?: string }> => {
    const response = await apiClient.get<ResultsResponse & { cached?: boolean; cached_at?: string }>(
      `/results/by-table-id/${encodeURIComponent(tableId)}?offset=${offset}&limit=${limit}&exclude_litigators=${excludeLitigators}&use_cache=${useCache}`
    );
    return response.data;
  },

  /**
   * Update table title
   */
  updateTableTitle: async (tableId: string, title: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/results/table-title/${encodeURIComponent(tableId)}`,
      { title }
    );
    return response.data;
  },

  /**
   * Export results as UTF-8 CSV with BOM (for Excel)
   */
  exportUtf8Csv: async (tableId: string, excludeLitigators: boolean = false): Promise<void> => {
    const response = await apiClient.get(
      `/results/export-utf8/${encodeURIComponent(tableId)}?exclude_litigators=${excludeLitigators}`,
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    let filename = `etl_results_${tableId}_${new Date().toISOString().split('T')[0]}.csv`;
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
   * List cached tables
   */
  listCachedTables: async (): Promise<{ cached_tables: CachedTable[]; total: number }> => {
    const response = await apiClient.get<{ cached_tables: CachedTable[]; total: number }>('/results/cached');
    return response.data;
  },

  /**
   * Invalidate cache for a table_id
   */
  invalidateCache: async (tableId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/results/cache/${encodeURIComponent(tableId)}`
    );
    return response.data;
  },

  // =====================
  // Blacklist Methods
  // =====================

  /**
   * Add litigator phones from a job to the blacklist
   */
  addLitigatorsToBlacklist: async (tableId: string): Promise<{ success: boolean; message: string; count: number }> => {
    const response = await apiClient.post<{ success: boolean; message: string; count: number }>(
      '/blacklist/add-litigators',
      { table_id: tableId }
    );
    return response.data;
  },

  /**
   * Get blacklist statistics
   */
  getBlacklistStats: async (): Promise<{
    total: number;
    by_reason: Record<string, number>;
    litigator_count: number;
    manual_count: number;
    dnc_count: number;
  }> => {
    const response = await apiClient.get('/blacklist/stats');
    return response.data;
  },
};
