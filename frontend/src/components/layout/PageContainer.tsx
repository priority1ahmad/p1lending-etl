/**
 * PageContainer Component
 * Consistent page wrapper with max-width and padding
 */

import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { backgrounds } from '../../theme';

export interface PageContainerProps {
  /** Page content */
  children: ReactNode;
  /** Max width variant */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Disable horizontal padding */
  noPadding?: boolean;
  /** Custom className */
  className?: string;
}

const maxWidthMap = {
  sm: '40rem',    // 640px
  md: '48rem',    // 768px
  lg: '64rem',    // 1024px
  xl: '80rem',    // 1280px
  full: '100%',
};

const Container = styled(Box, {
  shouldForwardProp: (prop) =>
    !['customMaxWidth', 'noPadding'].includes(prop as string),
})<{
  customMaxWidth: keyof typeof maxWidthMap;
  noPadding?: boolean;
}>(({ customMaxWidth, noPadding }) => ({
  width: '100%',
  maxWidth: maxWidthMap[customMaxWidth],
  margin: '0 auto',
  padding: noPadding ? 0 : '1.5rem',
  minHeight: '100%',
  backgroundColor: backgrounds.secondary,
}));

/**
 * PageContainer wraps page content with consistent width and padding
 *
 * @example
 * <PageContainer maxWidth="lg">
 *   <PageHeader title="Dashboard" />
 *   <Content />
 * </PageContainer>
 */
export function PageContainer({
  children,
  maxWidth = 'xl',
  noPadding = false,
  className,
}: PageContainerProps) {
  return (
    <Container
      customMaxWidth={maxWidth}
      noPadding={noPadding}
      className={className}
    >
      {children}
    </Container>
  );
}

export default PageContainer;
