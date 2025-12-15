/**
 * Login Page
 * Modern SaaS-style authentication form
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api/auth';
import { Button } from '../components/ui/Button/Button';
import { backgrounds, textColors, borderColors, palette } from '../theme';

export function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
        backgroundColor: backgrounds.secondary,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420, px: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            border: `1px solid ${borderColors.default}`,
            backgroundColor: backgrounds.primary,
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
                backgroundColor: palette.primary[800],
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
                  color: textColors.primary,
                  lineHeight: 1.2,
                }}
              >
                Priority 1 Lending
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: textColors.secondary,
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
              color: textColors.primary,
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: 4,
              color: textColors.secondary,
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
                    color: textColors.secondary,
                    '&.Mui-checked': {
                      color: palette.accent[500],
                    },
                  }}
                />
              }
              label="Remember me"
              sx={{
                mt: 1,
                '& .MuiFormControlLabel-label': {
                  color: textColors.secondary,
                  fontSize: '0.875rem',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="solid"
              colorScheme="accent"
              size="large"
              loading={loading}
              loadingText="Signing in..."
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
              }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
