/**
 * User Management API Service
 * Admin-only endpoints for user CRUD operations
 */

import apiClient from '../../utils/api';

// Types
export interface UserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersListResponse {
  users: UserListItem[];
  total: number;
}

export interface UserCreateRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  is_superuser: boolean;
}

export interface UserCreateResponse {
  user: UserListItem;
  temporary_password: string;
}

export interface PasswordResetRequest {
  new_password: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  email: string;
  ip_address?: string;
  user_agent?: string;
  login_status: string;
  failure_reason?: string;
  timestamp: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

// API Service
export const usersApi = {
  /**
   * List all users
   */
  list: async (): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>('/users/');
    return response.data;
  },

  /**
   * Create a new user with auto-generated temporary password
   */
  create: async (data: UserCreateRequest): Promise<UserCreateResponse> => {
    const response = await apiClient.post<UserCreateResponse>('/users/', data);
    return response.data;
  },

  /**
   * Delete a user (hard delete)
   */
  delete: async (userId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Reset a user's password (admin sets new password)
   */
  resetPassword: async (userId: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/users/${userId}/reset-password`,
      { new_password: newPassword }
    );
    return response.data;
  },

  /**
   * Get audit logs (login events + user management events)
   */
  getAuditLogs: async (page: number = 1, pageSize: number = 50): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>('/users/audit-logs', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
};
