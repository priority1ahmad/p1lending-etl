/**
 * ComplianceDonutChart Component
 * Donut/pie chart showing compliance breakdown
 * Data visualization for Clean vs Litigator vs DNC records
 */

import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../../ui/Card/Card';
import { palette, textColors } from '../../../theme';

export interface ComplianceData {
  /** Number of clean records */
  clean: number;
  /** Number of litigator records */
  litigator: number;
  /** Number of DNC records */
  dnc: number;
  /** Number of records on both lists */
  both: number;
}

export interface ComplianceDonutChartProps {
  /** Compliance data */
  data: ComplianceData;
  /** Chart title */
  title?: string;
  /** Chart subtitle/description */
  subtitle?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Chart size in pixels */
  size?: number;
}

// Color mapping
const COLORS = {
  clean: palette.success[500],
  litigator: palette.warning[500],
  dnc: palette.warning[600],
  both: palette.error[500],
};

/**
 * Donut chart for compliance breakdown
 *
 * @example
 * <ComplianceDonutChart
 *   title="Compliance Overview"
 *   data={{
 *     clean: 8500,
 *     litigator: 120,
 *     dnc: 280,
 *     both: 100,
 *   }}
 * />
 */
export function ComplianceDonutChart({
  data,
  title = 'Compliance Overview',
  subtitle,
  isLoading = false,
  size = 300,
}: ComplianceDonutChartProps) {
  // Transform data for recharts
  const chartData = [
    { name: 'Clean', value: data.clean, color: COLORS.clean },
    { name: 'Litigator Only', value: data.litigator, color: COLORS.litigator },
    { name: 'DNC Only', value: data.dnc, color: COLORS.dnc },
    { name: 'Both Lists', value: data.both, color: COLORS.both },
  ].filter((item) => item.value > 0); // Only show non-zero values

  const total = data.clean + data.litigator + data.dnc + data.both;

  if (isLoading) {
    return (
      <Card variant="default" padding="md" title={title} subtitle={subtitle}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: size,
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

  if (total === 0) {
    return (
      <Card variant="default" padding="md" title={title} subtitle={subtitle}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: size,
            backgroundColor: palette.gray[50],
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No compliance data available
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" title={title} subtitle={subtitle}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${palette.gray[200]}`,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: textColors.primary, fontWeight: 600 }}
              formatter={(value: number | undefined) => {
                if (!value) return '0 (0.0%)';
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value.toLocaleString()} (${percentage}%)`;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: { payload: { value: number } }) => {
                const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                return `${value}: ${entry.payload.value.toLocaleString()} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center stat */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            mt: -4,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: textColors.primary }}
          >
            {total.toLocaleString()}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: textColors.secondary, textTransform: 'uppercase' }}
          >
            Total Records
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

export default ComplianceDonutChart;
