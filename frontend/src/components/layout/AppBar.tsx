import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api/auth';

export const AppBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuth();
      navigate('/login');
    }
    handleMenuClose();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MuiAppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: '#FFFFFF',
        color: '#1A202C',
        boxShadow: '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
        zIndex: 1000,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 600,
            color: '#1E3A5F',
            '&:hover': {
              color: '#2D5A8A',
            },
          }} 
          onClick={() => navigate('/')}
        >
          Priority 1 Lending ETL
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            onClick={() => navigate('/')}
            sx={{
              color: '#4A5568',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#1E3A5F',
              },
            }}
          >
            Dashboard
          </Button>
          <Button 
            onClick={() => navigate('/sql-files')}
            sx={{
              color: '#4A5568',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#1E3A5F',
              },
            }}
          >
            SQL Files
          </Button>
          <Button 
            onClick={() => navigate('/config')}
            sx={{
              color: '#4A5568',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#1E3A5F',
              },
            }}
          >
            Configuration
          </Button>
          <Box
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              cursor: 'pointer',
              ml: 2,
              px: 2,
              py: 0.5,
              borderRadius: '0.5rem',
              '&:hover': {
                backgroundColor: '#F7F9FC',
              },
            }}
            onClick={handleMenuOpen}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#E8632B', color: '#FFFFFF' }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography 
              variant="body2"
              sx={{
                color: '#4A5568',
                fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user?.email}
            </Typography>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',
                mt: 1,
              },
            }}
          >
            <MenuItem 
              onClick={handleLogout}
              sx={{
                fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                '&:hover': {
                  backgroundColor: '#F7F9FC',
                },
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

