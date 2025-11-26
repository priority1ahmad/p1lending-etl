import apiClient from '../../utils/api';

export interface ConfigResponse {
  idicore_client_id?: string;
  idicore_client_secret?: string;
  google_sheet_url?: string;
  snowflake_account?: string;
  snowflake_user?: string;
  snowflake_database?: string;
  snowflake_schema?: string;
}

export interface ConfigUpdate {
  config: Record<string, any>;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export const configApi = {
  get: async (): Promise<ConfigResponse> => {
    const response = await apiClient.get<ConfigResponse>('/config');
    return response.data;
  },

  update: async (data: ConfigUpdate): Promise<ConfigResponse> => {
    const response = await apiClient.put<ConfigResponse>('/config', data);
    return response.data;
  },

  testIdiCORE: async (): Promise<TestConnectionResponse> => {
    const response = await apiClient.post<TestConnectionResponse>('/config/test/idicore');
    return response.data;
  },

  testSnowflake: async (): Promise<TestConnectionResponse> => {
    const response = await apiClient.post<TestConnectionResponse>('/config/test/snowflake');
    return response.data;
  },

  testGoogleSheets: async (): Promise<TestConnectionResponse> => {
    const response = await apiClient.post<TestConnectionResponse>('/config/test/google-sheets');
    return response.data;
  },
};

