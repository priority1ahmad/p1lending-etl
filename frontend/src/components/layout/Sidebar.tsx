import React, { useState } from 'react';
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
  Popover,
  Paper,
  Slide,
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
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api/auth';
import { brandColors } from '../../theme';

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
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);

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

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    setIsSettingsHovered(true);
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsMouseLeave = () => {
    setIsSettingsHovered(false);
    // Delay closing to allow mouse to move to popover
    setTimeout(() => {
      if (!isSettingsHovered) {
        setSettingsAnchor(null);
      }
    }, 100);
  };

  const handlePopoverClose = () => {
    setIsSettingsHovered(false);
    setSettingsAnchor(null);
  };

  const handleSettingsNavigate = (path: string) => {
    navigate(path);
    handlePopoverClose();
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

      {/* Application Settings Menu */}
      <Box sx={{ px: 1.5, pb: 1, mt: 'auto' }}>
        <Tooltip
          title={collapsed ? 'Application Settings' : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={handleSettingsClick}
            onMouseEnter={handleSettingsMouseEnter}
            onMouseLeave={handleSettingsMouseLeave}
            sx={{
              borderRadius: 1.5,
              px: collapsed ? 1.5 : 2,
              py: 1.25,
              justifyContent: collapsed ? 'center' : 'space-between',
              backgroundColor: location.pathname === '/config'
                ? 'rgba(80, 164, 217, 0.15)'
                : 'transparent',
              '&:hover': {
                backgroundColor: location.pathname === '/config'
                  ? 'rgba(80, 164, 217, 0.2)'
                  : 'rgba(255, 255, 255, 0.08)',
              },
              transition: 'background-color 0.15s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 1.5 }}>
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: location.pathname === '/config'
                    ? brandColors.skyBlue
                    : 'rgba(255, 255, 255, 0.7)',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Application Settings"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === '/config' ? 600 : 400,
                    color: location.pathname === '/config'
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              )}
            </Box>
            {!collapsed && (
              <Box sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <ChevronRightIcon
                  fontSize="small"
                  sx={{
                    transform: Boolean(settingsAnchor) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </Box>
            )}
          </ListItemButton>
        </Tooltip>

        {/* Settings Mega Menu Popover */}
        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
          slots={{
            transition: Slide,
          }}
          slotProps={{
            transition: {
              direction: 'right',
            } as any,
            paper: {
              onMouseEnter: () => setIsSettingsHovered(true),
              onMouseLeave: handlePopoverClose,
            },
          }}
          sx={{
            ml: 1,
            '& .MuiPopover-paper': {
              backgroundColor: brandColors.navy,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: 220,
            },
          }}
          disableRestoreFocus
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'transparent',
              p: 1,
            }}
          >
            <List sx={{ py: 0.5 }}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleSettingsNavigate('/config')}
                  sx={{
                    borderRadius: 1.5,
                    px: 2,
                    py: 1.25,
                    backgroundColor: location.pathname === '/config'
                      ? 'rgba(80, 164, 217, 0.15)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: location.pathname === '/config'
                        ? 'rgba(80, 164, 217, 0.2)'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: location.pathname === '/config'
                        ? brandColors.skyBlue
                        : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Configuration"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: location.pathname === '/config' ? 600 : 400,
                      color: location.pathname === '/config'
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.8)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Popover>
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
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: brandColors.gold,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
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
