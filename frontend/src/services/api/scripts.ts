import apiClient from '../../utils/api';

export interface SQLScript {
  id: string;
  name: string;
  description?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SQLScriptCreate {
  name: string;
  description?: string;
  content: string;
}

export interface SQLScriptUpdate {
  name?: string;
  description?: string;
  content?: string;
}

export const scriptsApi = {
  list: async (): Promise<SQLScript[]> => {
    const response = await apiClient.get<SQLScript[]>('/scripts');
    return response.data;
  },

  get: async (id: string): Promise<SQLScript> => {
    const response = await apiClient.get<SQLScript>(`/scripts/${id}`);
    return response.data;
  },

  create: async (data: SQLScriptCreate): Promise<SQLScript> => {
    const response = await apiClient.post<SQLScript>('/scripts', data);
    return response.data;
  },

  update: async (id: string, data: SQLScriptUpdate): Promise<SQLScript> => {
    const response = await apiClient.put<SQLScript>(`/scripts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/scripts/${id}`);
  },
};

