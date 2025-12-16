/**
 * ResultsMetricCard Component
 * Individual metric card with icon, value, and optional trend indicator
 */

import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { textColors, palette } from '../../../theme';

export interface ResultsMetricCardProps {
  /** Card title/label */
  title: string;
  /** Metric value (number or formatted string) */
  value: string | number;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Icon and accent color (use palette colors) */
  color: string;
  /** Optional trend percentage (positive or negative) */
  trend?: number;
  /** Optional suffix for value (e.g., '%', 'total') */
  suffix?: string;
}

export function ResultsMetricCard({
  title,
  value,
  icon,
  color,
  trend,
  suffix,
}: ResultsMetricCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  const hasTrend = trend !== undefined;
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <Card variant="default" padding="md">
      <Box sx={{ position: 'relative' }}>
        {/* Icon in top-right corner */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: `${color}15`, // 15% opacity
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            fontSize: 24,
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            color: textColors.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
            mb: 1,
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: hasTrend ? 1 : 0 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: textColors.primary,
              fontSize: '2rem',
              lineHeight: 1.2,
            }}
          >
            {formattedValue}
          </Typography>
          {suffix && (
            <Typography
              component="span"
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                color: textColors.secondary,
              }}
            >
              {suffix}
            </Typography>
          )}
        </Box>

        {/* Trend Indicator */}
        {hasTrend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
            }}
          >
            {trendPositive ? (
              <TrendingUp
                sx={{
                  fontSize: 16,
                  color: palette.success[500],
                }}
              />
            ) : (
              <TrendingDown
                sx={{
                  fontSize: 16,
                  color: palette.error[500],
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: trendPositive ? palette.success[600] : palette.error[600],
              }}
            >
              {trendPositive ? '+' : ''}
              {trend}%
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: textColors.secondary,
                ml: 0.5,
              }}
            >
              from last period
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default ResultsMetricCard;
