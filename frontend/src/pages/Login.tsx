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
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 3,
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            color: '#1E3A5F',
          }}
        >
          Priority 1 Lending ETL
        </Typography>
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            mb: 4,
            color: '#4A5568',
            fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
          }}
        >
          Sign in to your account
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: '0.5rem',
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.25rem',
              },
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.25rem',
              },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{
                  color: '#4A90D9',
                  '&.Mui-checked': {
                    color: '#4A90D9',
                  },
                }}
              />
            }
            label="Remember me"
            sx={{ 
              mt: 1,
              '& .MuiFormControlLabel-label': {
                fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                color: '#4A5568',
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.5,
              background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
              color: '#FFFFFF',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: '#CBD5E0',
                color: '#718096',
              },
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

