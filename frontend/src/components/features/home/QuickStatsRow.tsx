/**
 * QuickStatsRow Component
 * Compact row of KPI cards for at-a-glance metrics
 * Inspired by Airtable's dashboard number widgets
 */

import { Box, Typography, Skeleton } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircleOutline,
  WarningAmber,
  Block,
  Speed,
} from '@mui/icons-material';
import { palette, backgrounds, borderColors, textColors } from '../../../theme';

export interface StatItem {
  /** Unique identifier */
  id: string;
  /** Label for the stat */
  label: string;
  /** The main value to display */
  value: number | string;
  /** Optional icon */
  icon?: 'clean' | 'litigator' | 'dnc' | 'speed' | 'jobs';
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend percentage */
  trendValue?: string;
  /** Color theme */
  color?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export interface QuickStatsRowProps {
  /** Array of stats to display */
  stats: StatItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode - smaller cards */
  compact?: boolean;
}

const iconMap = {
  clean: CheckCircleOutline,
  litigator: WarningAmber,
  dnc: Block,
  speed: Speed,
  jobs: TrendingUp,
};

const colorMap = {
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.accent,
  default: palette.gray,
};

/**
 * Displays a row of compact KPI cards
 *
 * @example
 * <QuickStatsRow
 *   stats={[
 *     { id: '1', label: 'Clean Records', value: 12450, icon: 'clean', color: 'success' },
 *     { id: '2', label: 'Litigators', value: 234, icon: 'litigator', color: 'warning' },
 *     { id: '3', label: 'DNC', value: 89, icon: 'dnc', color: 'error' },
 *   ]}
 * />
 */
export function QuickStatsRow({
  stats,
  isLoading = false,
  compact = false,
}: QuickStatsRowProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: 2,
        }}
      >
        {stats.map((stat) => (
          <Box
            key={stat.id}
            sx={{
              p: compact ? 2 : 2.5,
              borderRadius: 2,
              border: `1px solid ${borderColors.default}`,
              backgroundColor: backgrounds.primary,
            }}
          >
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="80%" height={32} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
          md: `repeat(${Math.min(stats.length, 5)}, 1fr)`,
          lg: `repeat(${stats.length}, 1fr)`,
        },
        gap: 2,
      }}
    >
      {stats.map((stat) => {
        const colorPalette = colorMap[stat.color || 'default'];
        const Icon = stat.icon ? iconMap[stat.icon] : null;

        return (
          <Box
            key={stat.id}
            sx={{
              p: compact ? 2 : 2.5,
              borderRadius: 2,
              border: `1px solid ${borderColors.default}`,
              backgroundColor: backgrounds.primary,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                borderColor: colorPalette[300],
                boxShadow: `0 0 0 1px ${colorPalette[100]}`,
              },
            }}
          >
            {/* Label with icon */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1,
              }}
            >
              {Icon && (
                <Icon
                  sx={{
                    fontSize: compact ? 14 : 16,
                    color: colorPalette[500],
                  }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: textColors.secondary,
                  fontSize: compact ? '0.6875rem' : '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                }}
              >
                {stat.label}
              </Typography>
            </Box>

            {/* Value */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: compact ? '1.25rem' : '1.5rem',
                  color: textColors.primary,
                  lineHeight: 1.2,
                }}
              >
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString()
                  : (stat.value ?? 0)}
              </Typography>

              {/* Trend indicator */}
              {stat.trend && stat.trendValue && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    color:
                      stat.trend === 'up'
                        ? palette.success[600]
                        : stat.trend === 'down'
                          ? palette.error[600]
                          : textColors.secondary,
                  }}
                >
                  {stat.trend === 'up' && <TrendingUp sx={{ fontSize: 14 }} />}
                  {stat.trend === 'down' && (
                    <TrendingDown sx={{ fontSize: 14 }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, fontSize: '0.6875rem' }}
                  >
                    {stat.trendValue}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default QuickStatsRow;
