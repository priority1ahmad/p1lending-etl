/**
 * useNotification Hook
 * Wrapper around notistack for consistent toast notifications
 */

import { useSnackbar, type VariantType, type SnackbarKey } from 'notistack';
import { useCallback } from 'react';

export interface NotificationOptions {
  /** Auto-hide duration in milliseconds */
  autoHideDuration?: number;
  /** Persist until manually dismissed */
  persist?: boolean;
  /** Prevent duplicate notifications */
  preventDuplicate?: boolean;
}

export interface UseNotificationReturn {
  /** Show success notification */
  success: (message: string, options?: NotificationOptions) => SnackbarKey;
  /** Show error notification */
  error: (message: string, options?: NotificationOptions) => SnackbarKey;
  /** Show warning notification */
  warning: (message: string, options?: NotificationOptions) => SnackbarKey;
  /** Show info notification */
  info: (message: string, options?: NotificationOptions) => SnackbarKey;
  /** Close a specific notification */
  close: (key?: SnackbarKey) => void;
  /** Close all notifications */
  closeAll: () => void;
}

/**
 * Hook for showing toast notifications
 *
 * @example
 * const { success, error } = useNotification();
 *
 * // Show success toast
 * success('Profile updated successfully');
 *
 * // Show error with persist
 * error('Failed to save changes', { persist: true });
 */
export function useNotification(): UseNotificationReturn {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showNotification = useCallback(
    (message: string, variant: VariantType, options?: NotificationOptions) => {
      return enqueueSnackbar(message, {
        variant,
        autoHideDuration: options?.autoHideDuration ?? 4000,
        persist: options?.persist ?? false,
        preventDuplicate: options?.preventDuplicate ?? true,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      });
    },
    [enqueueSnackbar]
  );

  const success = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification(message, 'success', options),
    [showNotification]
  );

  const error = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification(message, 'error', { autoHideDuration: 6000, ...options }),
    [showNotification]
  );

  const warning = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification(message, 'warning', options),
    [showNotification]
  );

  const info = useCallback(
    (message: string, options?: NotificationOptions) =>
      showNotification(message, 'info', options),
    [showNotification]
  );

  const close = useCallback(
    (key?: SnackbarKey) => closeSnackbar(key),
    [closeSnackbar]
  );

  const closeAll = useCallback(() => closeSnackbar(), [closeSnackbar]);

  return {
    success,
    error,
    warning,
    info,
    close,
    closeAll,
  };
}

export default useNotification;
