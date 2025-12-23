/**
 * ProcessingTrendsChart Component
 * Bar chart showing processing volume trends over time
 * Data-dense visualization for dashboard analytics
 */

import { Box, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../../ui/Card/Card';
import { palette, textColors } from '../../../theme';

export interface TrendDataPoint {
  /** Date label (e.g., "Mon", "Jan 15") */
  date: string;
  /** Number of records processed */
  records: number;
  /** Optional: number of jobs */
  jobs?: number;
}

export interface ProcessingTrendsChartProps {
  /** Array of trend data points */
  data: TrendDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle/description */
  subtitle?: string;
  /** Show jobs line */
  showJobs?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Chart height in pixels */
  height?: number;
}

/**
 * Bar chart for processing volume trends
 *
 * @example
 * <ProcessingTrendsChart
 *   title="7-Day Processing Trend"
 *   data={[
 *     { date: 'Mon', records: 1200, jobs: 5 },
 *     { date: 'Tue', records: 1500, jobs: 6 },
 *     // ...
 *   ]}
 * />
 */
export function ProcessingTrendsChart({
  data,
  title = 'Processing Trends',
  subtitle,
  showJobs = false,
  isLoading = false,
  height = 300,
}: ProcessingTrendsChartProps) {
  if (isLoading) {
    return (
      <Card variant="default" padding="md" title={title} subtitle={subtitle}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: height,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.4 },
                '50%': { opacity: 0.8 },
              },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading chart data...
            </Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card variant="default" padding="md" title={title} subtitle={subtitle}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: height,
            backgroundColor: palette.gray[50],
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={palette.gray[200]} />
          <XAxis
            dataKey="date"
            tick={{ fill: textColors.secondary, fontSize: 12 }}
            axisLine={{ stroke: palette.gray[300] }}
          />
          <YAxis
            tick={{ fill: textColors.secondary, fontSize: 12 }}
            axisLine={{ stroke: palette.gray[300] }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: `1px solid ${palette.gray[200]}`,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: textColors.primary, fontWeight: 600 }}
            itemStyle={{ color: textColors.secondary }}
            formatter={(value: number | undefined) => value?.toLocaleString() || '0'}
          />
          <Bar
            dataKey="records"
            fill={palette.accent[500]}
            radius={[4, 4, 0, 0]}
            name="Records"
          />
          {showJobs && (
            <Bar
              dataKey="jobs"
              fill={palette.primary[600]}
              radius={[4, 4, 0, 0]}
              name="Jobs"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default ProcessingTrendsChart;
