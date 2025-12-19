/**
 * QuickActionCard Component
 * Large, prominent action button for dashboard quick actions
 * Data-dense professional style with icon and description
 */

import { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { palette, textColors } from '../../../theme';

export interface QuickActionCardProps {
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** Icon to display */
  icon: ReactNode;
  /** Icon/card accent color */
  color?: string;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Quick action card for dashboard
 *
 * @example
 * <QuickActionCard
 *   title="Start New Job"
 *   description="Create and run a new ETL job"
 *   icon={<PlayArrow />}
 *   color={palette.accent[500]}
 *   onClick={() => navigate('/jobs')}
 * />
 */
export function QuickActionCard({
  title,
  description,
  icon,
  color = palette.primary[800],
  onClick,
  disabled = false,
}: QuickActionCardProps) {
  return (
    <Card
      variant="default"
      padding="lg"
      hoverable={!disabled}
      onClick={disabled ? undefined : onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        '&:hover': disabled
          ? {}
          : {
              transform: 'translateY(-2px)',
            },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            color: color,
            fontSize: '1.75rem',
          }}
        >
          {icon}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: `${color}10`,
            color: color,
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowForward sx={{ fontSize: 20 }} />
        </Box>
      </Box>

      <Typography
        variant="h6"
        sx={{
          color: textColors.primary,
          fontWeight: 600,
          fontSize: '1.125rem',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: textColors.secondary,
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        {description}
      </Typography>
    </Card>
  );
}

export default QuickActionCard;
