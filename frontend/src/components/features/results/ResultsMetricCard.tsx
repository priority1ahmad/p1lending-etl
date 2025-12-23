/**
 * ResultsMetricCard Component
 * Compact metric card with value and optional trend indicator
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
  /** Accent color (use palette colors) */
  color: string;
  /** Optional trend percentage (positive or negative) */
  trend?: number;
  /** Optional suffix for value (e.g., '%', 'total') */
  suffix?: string;
}

export function ResultsMetricCard({
  title,
  value,
  color,
  trend,
  suffix,
}: ResultsMetricCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  const hasTrend = trend !== undefined;
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <Card variant="default" padding="xs">
      <Box>
        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            color: textColors.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            fontSize: '0.625rem',
            letterSpacing: '0.5px',
            mb: 0.25,
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: hasTrend ? 0.25 : 0 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color,
              fontSize: '1.25rem',
              lineHeight: 1.2,
            }}
          >
            {formattedValue}
          </Typography>
          {suffix && (
            <Typography
              component="span"
              sx={{
                fontSize: '0.6875rem',
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
              mt: 0.5,
            }}
          >
            {trendPositive ? (
              <TrendingUp
                sx={{
                  fontSize: 14,
                  color: palette.success[500],
                }}
              />
            ) : (
              <TrendingDown
                sx={{
                  fontSize: 14,
                  color: palette.error[500],
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.6875rem',
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
                fontSize: '0.6875rem',
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
