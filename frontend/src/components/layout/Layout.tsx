/**
 * Layout Component
 * Main app shell with sidebar and content area
 * Modern SaaS-style with fixed sidebar
 */

import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { backgrounds } from '../../theme';

interface LayoutProps {
  children: ReactNode;
}

const MainContent = styled(Box)({
  flexGrow: 1,
  backgroundColor: backgrounds.secondary,
  minHeight: '100vh',
  marginLeft: SIDEBAR_WIDTH,
  display: 'flex',
  flexDirection: 'column',
});

const ContentWrapper = styled(Box)({
  flex: 1,
  padding: 24,
  maxWidth: 1400,
  width: '100%',
  margin: '0 auto',
});

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <MainContent>
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </Box>
  );
};
