import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Sidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from './Sidebar';
import { brandColors } from '../../theme';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const marginLeft = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: brandColors.offWhite,
          minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            maxWidth: '1600px',
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
