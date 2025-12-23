/**
 * DashboardMetricCard Component
 * Displays a single metric with icon, value, and optional trend
 * Data-dense, professional styling for dashboard KPIs
 */

import { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { palette, textColors } from '../../../theme';

export interface DashboardMetricCardProps {
  /** Metric title */
  title: string;
  /** Main metric value (can be number or formatted string) */
  value: number | string;
  /** Icon to display */
  icon: ReactNode;
  /** Icon/card accent color */
  color?: string;
  /** Optional suffix (e.g., "%", "records") */
  suffix?: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  /** Loading state */
  isLoading?: boolean;
  /** Make card clickable */
  onClick?: () => void;
}

/**
 * Metric card for dashboard KPIs
 *
 * @example
 * <DashboardMetricCard
 *   title="Total Jobs"
 *   value={42}
 *   icon={<Folder />}
 *   color={palette.primary[800]}
 * />
 *
 * @example
 * // With trend
 * <DashboardMetricCard
 *   title="Success Rate"
 *   value={98.5}
 *   suffix="%"
 *   icon={<CheckCircle />}
 *   color={palette.success[500]}
 *   trend={{ value: 2.5, direction: 'up' }}
 * />
 */
export function DashboardMetricCard({
  title,
  value,
  icon,
  color = palette.primary[800],
  suffix,
  trend,
  isLoading = false,
  onClick,
}: DashboardMetricCardProps) {
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card
      variant="default"
      padding="md"
      hoverable={!!onClick}
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </Box>

        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor:
                trend.direction === 'up'
                  ? palette.success[50]
                  : palette.error[50],
              color:
                trend.direction === 'up'
                  ? palette.success[700]
                  : palette.error[700],
            }}
          >
            {trend.direction === 'up' ? (
              <TrendingUp sx={{ fontSize: 16 }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16 }} />
            )}
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            >
              {trend.value}%
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: textColors.secondary,
            fontSize: '0.8125rem',
            fontWeight: 500,
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          {title}
        </Typography>

        {isLoading ? (
          <Box
            sx={{
              width: '60%',
              height: 32,
              backgroundColor: palette.gray[200],
              borderRadius: 1,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
        ) : (
          <Typography
            variant="h4"
            sx={{
              color: textColors.primary,
              fontWeight: 700,
              fontSize: '1.75rem',
              lineHeight: 1.2,
            }}
          >
            {formattedValue}
            {suffix && (
              <Typography
                component="span"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: textColors.secondary,
                  ml: 0.5,
                }}
              >
                {suffix}
              </Typography>
            )}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export default DashboardMetricCard;
