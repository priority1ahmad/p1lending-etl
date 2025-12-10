import apiClient from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    const { setAuth } = useAuthStore.getState();
    setAuth(response.data.user, response.data.access_token, response.data.refresh_token);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    const { updateUser } = useAuthStore.getState();
    updateUser(response.data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  updateProfile: async (data: UserUpdateRequest): Promise<User> => {
    const response = await apiClient.put<User>('/auth/me', data);
    const { updateUser } = useAuthStore.getState();
    updateUser(response.data);
    return response.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },
};

