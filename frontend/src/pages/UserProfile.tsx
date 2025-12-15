/**
 * User Profile Page
 * Profile management with modern SaaS styling
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Alert,
  Avatar,
  Divider,
  Grid,
} from '@mui/material';
import { Save, CheckCircle, Error as ErrorIcon, Lock, Person } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api/auth';
import type { UserUpdateRequest, PasswordChangeRequest } from '../services/api/auth';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { textColors, palette } from '../theme';

export function UserProfile() {
  const { user } = useAuthStore();

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileStatus, setProfileStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserUpdateRequest) => authApi.updateProfile(data),
    onSuccess: () => {
      setProfileStatus({ success: true, message: 'Profile updated successfully' });
      setTimeout(() => setProfileStatus(null), 3000);
    },
    onError: (error: any) => {
      setProfileStatus({
        success: false,
        message: error.response?.data?.detail || 'Failed to update profile',
      });
      setTimeout(() => setProfileStatus(null), 5000);
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChangeRequest) => authApi.changePassword(data),
    onSuccess: () => {
      setPasswordStatus({ success: true, message: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 3000);
    },
    onError: (error: any) => {
      setPasswordStatus({
        success: false,
        message: error.response?.data?.detail || 'Failed to change password',
      });
      setTimeout(() => setPasswordStatus(null), 5000);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      setPasswordStatus({ success: false, message: 'Current password is required' });
      return;
    }
    if (!newPassword) {
      setPasswordStatus({ success: false, message: 'New password is required' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'New passwords do not match' });
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="User Profile"
        subtitle="Manage your account settings"
      />

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
        <Grid item xs={12} md={4}>
          <Card variant="default" padding="lg">
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: palette.accent[500],
                  fontSize: '2rem',
                  fontWeight: 600,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {getInitials()}
              </Avatar>
              <Box
                sx={{
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  color: textColors.primary,
                }}
              >
                {getDisplayName()}
              </Box>
              <Box
                sx={{
                  color: textColors.secondary,
                  mt: 0.5,
                }}
              >
                {user?.email}
              </Box>
              {user?.is_superuser && (
                <Box
                  sx={{
                    display: 'inline-block',
                    mt: 2,
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: palette.accent[50],
                    color: palette.accent[600],
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  Administrator
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Profile Edit Card */}
        {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
        <Grid item xs={12} md={8}>
          <Card variant="default" padding="lg">
            {/* Profile Information Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Person sx={{ color: palette.primary[800] }} />
              <Box sx={{ fontWeight: 600, color: textColors.primary }}>
                Profile Information
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </Grid>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </Grid>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="solid"
                colorScheme="accent"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                loading={updateProfileMutation.isPending}
                loadingText="Saving..."
              >
                Save Profile
              </Button>
            </Box>

            {profileStatus && (
              <Alert
                severity={profileStatus.success ? 'success' : 'error'}
                icon={profileStatus.success ? <CheckCircle /> : <ErrorIcon />}
                sx={{ mt: 2 }}
              >
                {profileStatus.message}
              </Alert>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Password Change Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Lock sx={{ color: palette.primary[800] }} />
              <Box sx={{ fontWeight: 600, color: textColors.primary }}>
                Change Password
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </Grid>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  helperText="Minimum 8 characters"
                />
              </Grid>
              {/* @ts-ignore - MUI v7 Grid item prop works at runtime */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  error={confirmPassword !== '' && newPassword !== confirmPassword}
                  helperText={
                    confirmPassword !== '' && newPassword !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="outline"
                startIcon={<Lock />}
                onClick={handleChangePassword}
                loading={changePasswordMutation.isPending}
                loadingText="Changing..."
              >
                Change Password
              </Button>
            </Box>

            {passwordStatus && (
              <Alert
                severity={passwordStatus.success ? 'success' : 'error'}
                icon={passwordStatus.success ? <CheckCircle /> : <ErrorIcon />}
                sx={{ mt: 2 }}
              >
                {passwordStatus.message}
              </Alert>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
