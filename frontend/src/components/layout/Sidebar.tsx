/**
 * Modern SaaS Sidebar Component
 * Always expanded (260px fixed width)
 * Linear/Notion/Vercel-inspired design
 */

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
import { styled } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MonitorHeart as MonitorHeartIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api/auth';
import { palette, textColors } from '../../theme';
import api from '../../utils/api';
import { SIDEBAR_WIDTH } from './sidebarConstants';

// ═══════════════════════════════════════════════════════════════
// Styled Components
// ═══════════════════════════════════════════════════════════════

const StyledDrawer = styled(Drawer)({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: palette.primary[800],
    color: textColors.inverse,
    borderRight: 'none',
    overflowX: 'hidden',
  },
});

const BrandSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1.25rem',
  minHeight: '4rem',
});

const BrandLogo = styled(Box)({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '0.5rem',
  backgroundColor: palette.accent[500],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '1rem',
  color: textColors.inverse,
  flexShrink: 0,
});

const SectionLabel = styled(Typography)({
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 1.25rem',
  marginBottom: '0.5rem',
  marginTop: '1.5rem',
});

const NavItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  borderRadius: '0.5rem',
  padding: '0.625rem 0.75rem',
  marginBottom: '0.125rem',
  backgroundColor: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
  borderLeft: active ? `0.1875rem solid ${palette.accent[500]}` : '0.1875rem solid transparent',
  marginLeft: '-0.1875rem',
  '&:hover': {
    backgroundColor: active
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(255, 255, 255, 0.06)',
  },
  transition: 'all 0.15s ease',
}));

const HealthPanel = styled(Box)({
  margin: '0.5rem 1rem 0',
  padding: '0.75rem',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '0.5rem',
  border: '0.0625rem solid rgba(255, 255, 255, 0.06)',
});

const UserSection = styled(Box)({
  padding: '1rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  borderTop: '0.0625rem solid rgba(255, 255, 255, 0.08)',
});

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface ServiceHealth {
  status: 'connected' | 'disconnected' | 'error' | 'unknown' | 'checking';
  error?: string;
}

interface HealthData {
  snowflake: ServiceHealth;
  redis: ServiceHealth;
  postgresql: ServiceHealth;
  celery: ServiceHealth;
  ntfy: ServiceHealth;
}

// ═══════════════════════════════════════════════════════════════
// Navigation Items
// ═══════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'SQL Scripts', path: '/sql-files', icon: <CodeIcon /> },
  { label: 'ETL Results', path: '/results', icon: <TableChartIcon /> },
  { label: 'Re-scrub', path: '/rescrub', icon: <RefreshIcon /> },
];

// Admin-only navigation items (visible only to superusers)
const adminNavItems: NavItem[] = [
  { label: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
];

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  // System Health state
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // Health Data Fetching
  // ═══════════════════════════════════════════════════════════════

  const fetchHealthData = useCallback(async () => {
    setHealthLoading(true);
    try {
      const response = await api.get('/health/services');
      setHealthData(response.data);
      setLastHealthCheck(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setHealthData({
        snowflake: { status: 'error', error: 'Failed to check' },
        redis: { status: 'error', error: 'Failed to check' },
        postgresql: { status: 'error', error: 'Failed to check' },
        celery: { status: 'error', error: 'Failed to check' },
        ntfy: { status: 'error', error: 'Failed to check' },
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (healthExpanded && !healthData) {
      fetchHealthData();
    }
  }, [healthExpanded, healthData, fetchHealthData]);

  useEffect(() => {
    if (!healthExpanded) return;
    const interval = setInterval(fetchHealthData, 60000);
    return () => clearInterval(interval);
  }, [healthExpanded, fetchHealthData]);

  // ═══════════════════════════════════════════════════════════════
  // Helper Functions
  // ═══════════════════════════════════════════════════════════════

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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon sx={{ fontSize: '0.875rem', color: palette.success[400] }} />;
      case 'error':
      case 'disconnected':
        return <ErrorIcon sx={{ fontSize: '0.875rem', color: palette.error[400] }} />;
      default:
        return <WarningIcon sx={{ fontSize: '0.875rem', color: palette.warning[400] }} />;
    }
  };

  const getOverallHealthDots = () => {
    if (!healthData) return null;
    const statuses = Object.values(healthData).map((s) => s.status);
    const connected = statuses.filter((s) => s === 'connected').length;
    const total = statuses.length;

    return (
      <Box sx={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: '0.3125rem',
              height: '0.3125rem',
              borderRadius: '50%',
              backgroundColor:
                i < connected ? palette.success[400] : palette.error[400],
            }}
          />
        ))}
      </Box>
    );
  };

  const formatLastChecked = () => {
    if (!lastHealthCheck) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastHealthCheck.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastHealthCheck.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatServiceName = (service: string) => {
    const names: Record<string, string> = {
      snowflake: 'Snowflake',
      redis: 'Redis',
      postgresql: 'PostgreSQL',
      celery: 'Celery',
      ntfy: 'NTFY',
    };
    return names[service] || service;
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <StyledDrawer variant="permanent">
      {/* Brand Section */}
      <BrandSection>
        <BrandLogo>P1</BrandLogo>
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              lineHeight: 1.2,
              color: textColors.inverse,
            }}
          >
            P1 Lending
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.6875rem',
            }}
          >
            ETL System
          </Typography>
        </Box>
      </BrandSection>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mx: '1.25rem' }} />

      {/* Navigation Items */}
      <List sx={{ px: '1rem', py: '0.75rem', flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <NavItemButton
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: '2.25rem',
                  color: isActive(item.path)
                    ? palette.accent[400]
                    : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.path) ? 500 : 400,
                  color: isActive(item.path)
                    ? textColors.inverse
                    : 'rgba(255, 255, 255, 0.75)',
                }}
              />
            </NavItemButton>
          </ListItem>
        ))}

        {/* Admin Section (superusers only) */}
        {user?.is_superuser && (
          <>
            <SectionLabel>Admin</SectionLabel>
            {adminNavItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <NavItemButton
                  active={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: '2.25rem',
                      color: isActive(item.path)
                        ? palette.accent[400]
                        : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive(item.path) ? 500 : 400,
                      color: isActive(item.path)
                        ? textColors.inverse
                        : 'rgba(255, 255, 255, 0.75)',
                    }}
                  />
                </NavItemButton>
              </ListItem>
            ))}
          </>
        )}

        {/* System Health Section */}
        <Box sx={{ mt: 'auto' }}>
          <SectionLabel>System</SectionLabel>
          <ListItem disablePadding>
            <NavItemButton onClick={() => setHealthExpanded(!healthExpanded)}>
              <ListItemIcon
                sx={{
                  minWidth: '2.25rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <MonitorHeartIcon />
              </ListItemIcon>
              <ListItemText
                primary="Health"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.75)',
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {healthData && getOverallHealthDots()}
                {healthExpanded ? (
                  <ExpandLessIcon
                    sx={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.4)' }}
                  />
                ) : (
                  <ExpandMoreIcon
                    sx={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.4)' }}
                  />
                )}
              </Box>
            </NavItemButton>
          </ListItem>

          {/* Health Panel */}
          <Collapse in={healthExpanded} timeout="auto" unmountOnExit>
            <HealthPanel>
              {healthLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: '1rem' }}>
                  <CircularProgress
                    size="1.25rem"
                    sx={{ color: palette.accent[400] }}
                  />
                </Box>
              ) : (
                <>
                  {healthData &&
                    Object.entries(healthData).map(([service, data]) => (
                      <Box
                        key={service}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: '0.25rem',
                        }}
                      >
                        <Typography
                          sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatServiceName(service)}
                        </Typography>
                        <Tooltip
                          title={data.error || data.status}
                          placement="left"
                        >
                          <Box sx={{ display: 'flex' }}>
                            {getStatusIcon(data.status)}
                          </Box>
                        </Tooltip>
                      </Box>
                    ))}

                  {/* Footer */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: '0.5rem',
                      pt: '0.5rem',
                      borderTop: '0.0625rem solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.35)',
                        fontSize: '0.6875rem',
                      }}
                    >
                      {formatLastChecked()}
                    </Typography>
                    <Tooltip title="Refresh">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchHealthData();
                        }}
                        size="small"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.35)',
                          p: '0.25rem',
                          '&:hover': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: '0.875rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </>
              )}
            </HealthPanel>
          </Collapse>
        </Box>
      </List>

      {/* User Section */}
      <UserSection>
        <Tooltip title="Profile">
          <Avatar
            onClick={() => navigate('/profile')}
            sx={{
              width: '2.25rem',
              height: '2.25rem',
              bgcolor: palette.accent[500],
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
              '&:hover': {
                opacity: 0.85,
              },
            }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </Tooltip>

        <Box
          onClick={() => navigate('/profile')}
          sx={{
            flex: 1,
            minWidth: 0,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
            '&:hover': {
              opacity: 0.85,
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              color: textColors.inverse,
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
            sx={{
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '0.6875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.email}
          </Typography>
        </Box>

        <Tooltip title="Logout">
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.45)',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: textColors.inverse,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </UserSection>
    </StyledDrawer>
  );
};
