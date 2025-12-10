import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  Avatar,
  Divider,
} from '@mui/material';
import { Save, CheckCircle, Error as ErrorIcon, Lock, Person } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api/auth';
import type { UserUpdateRequest, PasswordChangeRequest } from '../services/api/auth';
import { brandColors } from '../theme';

export const UserProfile: React.FC = () => {
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
    // Client-side validation
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          mb: 4,
          fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
          fontWeight: 700,
          color: '#1E3A5F',
        }}
      >
        User Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: brandColors.gold,
                  fontSize: '2rem',
                  fontWeight: 600,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {getInitials()}
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                {getDisplayName()}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#4A5568',
                  fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                  mt: 0.5,
                }}
              >
                {user?.email}
              </Typography>
              {user?.is_superuser && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-block',
                    mt: 2,
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(80, 164, 217, 0.15)',
                    color: brandColors.skyBlue,
                    fontWeight: 600,
                  }}
                >
                  Administrator
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Edit Card */}
        {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Person sx={{ color: brandColors.navy }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                  }}
                >
                  Profile Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </Grid>
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </Grid>
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
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
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  sx={{
                    background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                    color: '#FFFFFF',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                      boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
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
                <Lock sx={{ color: brandColors.navy }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                  }}
                >
                  Change Password
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
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
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
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
                {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
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
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  sx={{
                    borderColor: '#1E3A5F',
                    color: '#1E3A5F',
                    borderWidth: '2px',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    '&:hover': {
                      borderWidth: '2px',
                      backgroundColor: '#1E3A5F',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
