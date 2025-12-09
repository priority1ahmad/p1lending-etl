import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api/auth';
import { brandColors } from '../theme';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.user, response.access_token, response.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandColors.offWhite,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            boxShadow: '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                backgroundColor: brandColors.navy,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              P1
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: brandColors.navy,
                  lineHeight: 1.2,
                }}
              >
                Priority 1 Lending
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: brandColors.blueGray,
                  fontSize: '0.75rem',
                }}
              >
                ETL System
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="h6"
            align="center"
            sx={{
              mb: 1,
              fontWeight: 600,
              color: brandColors.navy,
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: 4,
              color: brandColors.blueGray,
            }}
          >
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              size="medium"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              size="medium"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: brandColors.blueGray,
                    '&.Mui-checked': {
                      color: brandColors.skyBlue,
                    },
                  }}
                />
              }
              label="Remember me"
              sx={{
                mt: 1,
                '& .MuiFormControlLabel-label': {
                  color: brandColors.blueGray,
                  fontSize: '0.875rem',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontWeight: 600,
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
