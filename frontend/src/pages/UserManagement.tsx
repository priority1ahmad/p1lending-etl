/**
 * User Management Page (Admin Only)
 *
 * Features:
 * - List all users with status and actions
 * - Create new users with auto-generated passwords
 * - Delete users (hard delete)
 * - Reset user passwords
 * - View audit logs (login events + user management)
 */

import { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Delete,
  LockReset,
  ContentCopy,
  CheckCircle,
  Person,
  Security,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { usersApi } from '../services/api/users';
import type { UserListItem, AuditLog } from '../services/api/users';
import { useAuthStore } from '../stores/authStore';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { textColors, backgrounds, palette } from '../theme';

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [passwordDisplayOpen, setPasswordDisplayOpen] = useState(false);

  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserIsSuperuser, setNewUserIsSuperuser] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Selection states
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Audit log pagination
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(25);

  // Query: List users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  // Query: Audit logs (only fetch when on audit tab)
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs', auditPage + 1, auditRowsPerPage],
    queryFn: () => usersApi.getAuditLogs(auditPage + 1, auditRowsPerPage),
    enabled: activeTab === 1,
  });

  // Mutation: Create user
  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (data) => {
      setTempPassword(data.temporary_password);
      setAddUserOpen(false);
      setPasswordDisplayOpen(true);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      resetAddUserForm();
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.detail || 'Failed to create user', {
        variant: 'error',
      });
    },
  });

  // Mutation: Delete user
  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.detail || 'Failed to delete user', {
        variant: 'error',
      });
    },
  });

  // Mutation: Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      usersApi.resetPassword(userId, password),
    onSuccess: () => {
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.detail || 'Failed to reset password', {
        variant: 'error',
      });
    },
  });

  // Helpers
  const resetAddUserForm = () => {
    setNewUserEmail('');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserIsSuperuser(false);
  };

  const handleCreateUser = () => {
    if (!newUserEmail) {
      enqueueSnackbar('Email is required', { variant: 'error' });
      return;
    }
    createUserMutation.mutate({
      email: newUserEmail,
      first_name: newUserFirstName || undefined,
      last_name: newUserLastName || undefined,
      is_superuser: newUserIsSuperuser,
    });
  };

  const handleDeleteClick = (user: UserListItem) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPasswordClick = (user: UserListItem) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 8) {
      enqueueSnackbar('Password must be at least 8 characters', { variant: 'error' });
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      enqueueSnackbar('Failed to copy password', { variant: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayName = (user: UserListItem) => {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.full_name) return user.full_name;
    return user.email.split('@')[0];
  };

  const getEventTypeLabel = (status: string) => {
    const labels: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
      success: { label: 'Login Success', color: 'success' },
      invalid_email: { label: 'Invalid Email', color: 'error' },
      invalid_password: { label: 'Invalid Password', color: 'error' },
      inactive_user: { label: 'Inactive User', color: 'warning' },
      account_locked: { label: 'Account Locked', color: 'error' },
      user_created: { label: 'User Created', color: 'info' },
      user_deleted: { label: 'User Deleted', color: 'warning' },
      password_reset_by_admin: { label: 'Password Reset', color: 'info' },
    };
    return labels[status] || { label: status, color: 'default' as const };
  };

  // Table cell styles
  const headerCellSx = {
    fontWeight: 600,
    color: textColors.primary,
    fontSize: '0.8125rem',
    py: 1.5,
  };

  const bodyCellSx = {
    color: textColors.secondary,
    fontSize: '0.875rem',
    py: 1.5,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="User Management"
        subtitle="Manage system users and view audit logs"
      />

      <Card variant="default" padding="none">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Users" />
            <Tab icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" label="Audit Logs" />
          </Tabs>
        </Box>

        {/* Users Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="solid"
                colorScheme="accent"
                startIcon={<Add />}
                onClick={() => setAddUserOpen(true)}
              >
                Add User
              </Button>
            </Box>

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : usersData?.users.length === 0 ? (
              <EmptyState
                icon={<Person sx={{ fontSize: 64 }} />}
                title="No users found"
                description="Create your first user to get started"
                size="lg"
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: backgrounds.secondary }}>
                      <TableCell sx={headerCellSx}>Email</TableCell>
                      <TableCell sx={headerCellSx}>Name</TableCell>
                      <TableCell sx={headerCellSx}>Status</TableCell>
                      <TableCell sx={headerCellSx}>Role</TableCell>
                      <TableCell sx={headerCellSx}>Created</TableCell>
                      <TableCell align="right" sx={headerCellSx}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersData?.users.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ '&:hover': { backgroundColor: backgrounds.secondary } }}
                      >
                        <TableCell>
                          <Box sx={{ fontWeight: 600, color: textColors.primary }}>
                            {user.email}
                          </Box>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{getDisplayName(user)}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_superuser ? 'Admin' : 'User'}
                            size="small"
                            color={user.is_superuser ? 'primary' : 'default'}
                            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, fontSize: '0.8125rem' }}>
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Reset Password">
                              <IconButton
                                size="small"
                                onClick={() => handleResetPasswordClick(user)}
                                sx={{ color: palette.primary[800] }}
                              >
                                <LockReset fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete User"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={user.id === currentUser?.id}
                                  sx={{ color: palette.error[500] }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Audit Logs Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            {auditLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : auditData?.logs.length === 0 ? (
              <EmptyState
                icon={<Security sx={{ fontSize: 64 }} />}
                title="No audit logs found"
                description="Audit logs will appear here as users log in and perform actions"
                size="lg"
              />
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: backgrounds.secondary }}>
                        <TableCell sx={headerCellSx}>Timestamp</TableCell>
                        <TableCell sx={headerCellSx}>Event</TableCell>
                        <TableCell sx={headerCellSx}>Email</TableCell>
                        <TableCell sx={headerCellSx}>IP Address</TableCell>
                        <TableCell sx={headerCellSx}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditData?.logs.map((log: AuditLog) => {
                        const eventType = getEventTypeLabel(log.login_status);
                        return (
                          <TableRow
                            key={log.id}
                            hover
                            sx={{ '&:hover': { backgroundColor: backgrounds.secondary } }}
                          >
                            <TableCell sx={{ ...bodyCellSx, fontSize: '0.8125rem' }}>
                              {formatDate(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={eventType.label}
                                size="small"
                                color={eventType.color}
                                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell sx={bodyCellSx}>{log.email}</TableCell>
                            <TableCell sx={{ ...bodyCellSx, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                              {log.ip_address || '—'}
                            </TableCell>
                            <TableCell sx={{ ...bodyCellSx, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.failure_reason || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={auditData?.total || 0}
                  page={auditPage}
                  onPageChange={(_, newPage) => setAuditPage(newPage)}
                  rowsPerPage={auditRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setAuditRowsPerPage(parseInt(e.target.value, 10));
                    setAuditPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
                placeholder="John"
                fullWidth
              />
              <TextField
                label="Last Name"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
                placeholder="Doe"
                fullWidth
              />
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newUserIsSuperuser}
                  onChange={(e) => setNewUserIsSuperuser(e.target.checked)}
                />
              }
              label="Grant administrator privileges"
            />
            <Alert severity="info" sx={{ mt: 1 }}>
              A temporary password will be generated automatically. You&apos;ll need to share it with the user.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="outline" onClick={() => setAddUserOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            colorScheme="accent"
            onClick={handleCreateUser}
            loading={createUserMutation.isPending}
            loadingText="Creating..."
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={passwordDisplayOpen} onClose={() => setPasswordDisplayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          User Created Successfully
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Save this password now! It will not be shown again.
          </Alert>
          <Box
            sx={{
              p: 2,
              bgcolor: backgrounds.secondary,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: textColors.primary,
                letterSpacing: '0.05em',
              }}
            >
              {tempPassword}
            </Box>
            <Tooltip title={passwordCopied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={copyPassword} color={passwordCopied ? 'success' : 'default'}>
                {passwordCopied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ mt: 2, color: textColors.secondary, fontSize: '0.875rem' }}>
            Share this temporary password with the user securely. They should change it after their first login.
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="solid" onClick={() => setPasswordDisplayOpen(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{selectedUser?.email}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            colorScheme="error"
            onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
            loading={deleteUserMutation.isPending}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Set a new password for <strong>{selectedUser?.email}</strong>
          </DialogContentText>
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            fullWidth
            helperText="Minimum 8 characters"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            colorScheme="accent"
            onClick={handleResetPassword}
            loading={resetPasswordMutation.isPending}
            loadingText="Resetting..."
            disabled={!newPassword || newPassword.length < 8}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
