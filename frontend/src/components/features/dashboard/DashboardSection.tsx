/**
 * DashboardSection Component
 * Reusable wrapper for dashboard content sections with title and subtitle
 */

import { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { textColors } from '../../../theme';

export interface DashboardSectionProps {
  /** Section title */
  title: string;
  /** Optional section subtitle or description */
  subtitle?: string;
  /** Content to display */
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Bottom margin */
  mb?: number | string;
}

/**
 * Reusable dashboard section container
 *
 * @example
 * <DashboardSection title="Overview" subtitle="Key metrics">
 *   <QuickStatsRow stats={stats} />
 * </DashboardSection>
 */
export function DashboardSection({
  title,
  subtitle,
  children,
  className,
  mb = 4,
}: DashboardSectionProps) {
  return (
    <Box sx={{ mb, className }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
            fontSize: '1.125rem',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{ color: textColors.secondary, fontSize: '0.875rem' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

export default DashboardSection;
