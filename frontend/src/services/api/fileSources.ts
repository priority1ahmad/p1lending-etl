import apiClient from '../../utils/api';
import type {
  FileSource,
  FileSourceCreate,
  FileSourceUpdate,
  FileUploadResponse,
} from '../../types/fileSource';

export const fileSourcesApi = {
  /**
   * Get all file sources
   */
  list: async (): Promise<FileSource[]> => {
    const response = await apiClient.get<FileSource[]>('/file-sources');
    return response.data;
  },

  /**
   * Get a specific file source by ID
   */
  get: async (id: string): Promise<FileSource> => {
    const response = await apiClient.get<FileSource>(`/file-sources/${id}`);
    return response.data;
  },

  /**
   * Upload and parse a file (Excel or CSV)
   * Returns detected columns and sample data
   */
  upload: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<FileUploadResponse>(
      '/file-sources/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Create a new file source with column mapping
   */
  create: async (data: FileSourceCreate): Promise<FileSource> => {
    const response = await apiClient.post<FileSource>('/file-sources', data);
    return response.data;
  },

  /**
   * Update an existing file source
   */
  update: async (id: string, data: FileSourceUpdate): Promise<FileSource> => {
    const response = await apiClient.put<FileSource>(`/file-sources/${id}`, data);
    return response.data;
  },

  /**
   * Delete a file source
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/file-sources/${id}`);
  },

  /**
   * Validate column mapping
   */
  validateMapping: async (mapping: Record<string, string>): Promise<{ valid: boolean; errors?: string[] }> => {
    const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
      '/file-sources/validate-mapping',
      { mapping }
    );
    return response.data;
  },
};
