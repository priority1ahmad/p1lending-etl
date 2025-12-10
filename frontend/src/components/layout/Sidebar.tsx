import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MonitorHeart as MonitorHeartIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api/auth';
import { brandColors } from '../../theme';
import api from '../../utils/api';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'SQL Scripts', path: '/sql-files', icon: <CodeIcon /> },
  { label: 'ETL Results', path: '/results', icon: <TableChartIcon /> },
  { label: 'Re-scrub', path: '/rescrub', icon: <RefreshIcon /> },
  { label: 'Configuration', path: '/config', icon: <SettingsIcon /> },
];

// Service health status types
interface ServiceHealth {
  status: 'connected' | 'disconnected' | 'error' | 'unknown' | 'checking';
  error?: string;
  last_checked?: string;
}

interface HealthData {
  snowflake: ServiceHealth;
  google_sheets: ServiceHealth;
  redis: ServiceHealth;
  postgresql: ServiceHealth;
  celery: ServiceHealth;
  ntfy: ServiceHealth;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  // System Health state
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    setHealthLoading(true);
    try {
      const response = await api.get('/health/services');
      setHealthData(response.data);
      setLastHealthCheck(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      // Set error state for all services
      setHealthData({
        snowflake: { status: 'error', error: 'Failed to check' },
        google_sheets: { status: 'error', error: 'Failed to check' },
        redis: { status: 'error', error: 'Failed to check' },
        postgresql: { status: 'error', error: 'Failed to check' },
        celery: { status: 'error', error: 'Failed to check' },
        ntfy: { status: 'error', error: 'Failed to check' },
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch health data on mount and when expanded
  useEffect(() => {
    if (healthExpanded && !healthData) {
      fetchHealthData();
    }
  }, [healthExpanded, healthData, fetchHealthData]);

  // Auto-refresh health data every 60 seconds when expanded
  useEffect(() => {
    if (!healthExpanded) return;

    const interval = setInterval(fetchHealthData, 60000);
    return () => clearInterval(interval);
  }, [healthExpanded, fetchHealthData]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuth();
      navigate('/login');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon sx={{ fontSize: 14, color: '#4CAF50' }} />;
      case 'error':
      case 'disconnected':
        return <ErrorIcon sx={{ fontSize: 14, color: '#f44336' }} />;
      case 'unknown':
      case 'checking':
        return <WarningIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
      default:
        return <WarningIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
    }
  };

  const getOverallHealthStatus = () => {
    if (!healthData) return 'unknown';
    const statuses = Object.values(healthData).map(s => s.status);
    if (statuses.every(s => s === 'connected')) return 'healthy';
    if (statuses.some(s => s === 'error' || s === 'disconnected')) return 'error';
    return 'warning';
  };

  const getOverallHealthIcon = () => {
    const status = getOverallHealthStatus();
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 18, color: '#f44336' }} />;
      default:
        return <WarningIcon sx={{ fontSize: 18, color: '#ff9800' }} />;
    }
  };

  const formatLastChecked = () => {
    if (!lastHealthCheck) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastHealthCheck.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastHealthCheck.toLocaleTimeString();
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: brandColors.navy,
          color: '#FFFFFF',
          borderRight: 'none',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo/Brand Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2,
          py: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                backgroundColor: brandColors.skyBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              P1
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  lineHeight: 1.2,
                  color: '#FFFFFF',
                }}
              >
                Priority 1 Lending
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.6875rem',
                }}
              >
                ETL System
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              backgroundColor: brandColors.skyBlue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            P1
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />

      {/* Navigation Items */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  px: collapsed ? 1.5 : 2,
                  py: 1.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive(item.path)
                    ? 'rgba(80, 164, 217, 0.15)'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(item.path)
                      ? 'rgba(80, 164, 217, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                  transition: 'background-color 0.15s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 40,
                    color: isActive(item.path)
                      ? brandColors.skyBlue
                      : 'rgba(255, 255, 255, 0.7)',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path)
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.8)',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* System Health Section */}
      <Box sx={{ px: 1.5, pb: 1, mt: 'auto' }}>
        <Tooltip
          title={collapsed ? 'System Health' : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              if (!collapsed) {
                setHealthExpanded(!healthExpanded);
              }
            }}
            sx={{
              borderRadius: 1.5,
              px: collapsed ? 1.5 : 2,
              py: 1,
              justifyContent: collapsed ? 'center' : 'space-between',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              transition: 'background-color 0.15s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 1.5 }}>
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: 'rgba(255, 255, 255, 0.7)',
                  justifyContent: 'center',
                }}
              >
                <MonitorHeartIcon />
              </ListItemIcon>
              {!collapsed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ListItemText
                    primary="System Health"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  />
                  {healthData && getOverallHealthIcon()}
                </Box>
              )}
            </Box>
            {!collapsed && (
              <Box sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {healthExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
            )}
          </ListItemButton>
        </Tooltip>

        {/* Collapsible Health Details */}
        {!collapsed && (
          <Collapse in={healthExpanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 1.5,
              }}
            >
              {healthLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} sx={{ color: brandColors.skyBlue }} />
                </Box>
              ) : (
                <>
                  {/* Service Status List */}
                  {healthData && Object.entries(healthData).map(([service, data]) => (
                    <Box
                      key={service}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        px: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          textTransform: 'capitalize',
                          fontSize: '0.7rem',
                        }}
                      >
                        {service.replace('_', ' ')}
                      </Typography>
                      <Tooltip title={data.error || data.status} placement="left">
                        <Box>{getStatusIcon(data.status)}</Box>
                      </Tooltip>
                    </Box>
                  ))}

                  {/* Last Checked + Refresh */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 1,
                      pt: 1,
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.65rem',
                      }}
                    >
                      Last: {formatLastChecked()}
                    </Typography>
                    <Tooltip title="Refresh" placement="left">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchHealthData();
                        }}
                        size="small"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          p: 0.5,
                          '&:hover': {
                            color: '#FFFFFF',
                          },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </>
              )}
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Collapse Toggle */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <IconButton
            onClick={onToggle}
            sx={{
              width: '100%',
              borderRadius: 1.5,
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
              },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />

      {/* User Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Tooltip title={collapsed ? 'Profile' : ''} placement="right">
          <Avatar
            onClick={() => navigate('/profile')}
            sx={{
              width: 36,
              height: 36,
              bgcolor: brandColors.gold,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </Tooltip>
        {!collapsed && (
          <Box
            onClick={() => navigate('/profile')}
            sx={{
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.full_name || user?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.6875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        )}
        {!collapsed && (
          <Tooltip title="Profile" placement="top">
            <IconButton
              onClick={() => navigate('/profile')}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <PersonIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Logout" placement="right">
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED };
