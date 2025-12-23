/**
 * Results Overview Charts Component
 * Displays pie chart and bar chart for ETL results analytics
 */

import { useMemo } from 'react';
import { Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '../../ui/Card/Card';
import { palette } from '../../../theme';
import type { ResultsStats } from '../../../services/api/results';

/**
 * JobStats interface for top jobs data
 */
export interface JobStats {
  job_name: string;
  record_count: number;
}

interface ResultsOverviewChartsProps {
  stats: ResultsStats;
  topJobs: JobStats[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

/**
 * Custom tooltip for charts with clean styling
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: `1px solid ${palette.gray[200]}`,
          borderRadius: 8,
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {label && (
          <p
            style={{
              margin: '0 0 8px 0',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: palette.gray[900],
            }}
          >
            {label}
          </p>
        )}
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            style={{
              margin: '4px 0',
              fontSize: '0.8125rem',
              color: entry.color,
            }}
          >
            <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
            {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * ResultsOverviewCharts - Display pie and bar charts for ETL results
 *
 * @example
 * <ResultsOverviewCharts
 *   stats={resultsStats}
 *   topJobs={topJobsList}
 * />
 */
export default function ResultsOverviewCharts({
  stats,
  topJobs,
}: ResultsOverviewChartsProps) {
  // Prepare pie chart data
  const pieData = useMemo(
    () => [
      {
        name: 'Clean Records',
        value: stats.clean_records,
        color: palette.success[500],
      },
      {
        name: 'Litigators',
        value: stats.total_litigators,
        color: palette.warning[500],
      },
    ],
    [stats]
  );

  // Prepare bar chart data - limit to top 10
  const barData = useMemo(
    () =>
      topJobs.slice(0, 10).map((job) => ({
        name: job.job_name.length > 20
          ? `${job.job_name.substring(0, 20)}...`
          : job.job_name,
        fullName: job.job_name,
        records: job.record_count,
      })),
    [topJobs]
  );

  return (
    <Grid container spacing={3}>
      {/* Pie Chart - Clean vs Litigators */}
      {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
      <Grid item xs={12} md={6}>
        <Card
          title="Clean vs Litigator Distribution"
          subtitle={`${stats.total_records.toLocaleString()} total records`}
          padding="md"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(1)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span style={{ color: palette.gray[700], fontSize: '0.875rem' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      {/* Bar Chart - Top 10 Jobs */}
      {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
      <Grid item xs={12} md={6}>
        <Card
          title="Top 10 Jobs by Record Count"
          subtitle={`${stats.total_jobs} total jobs`}
          padding="md"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={palette.gray[200]} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: palette.gray[600], fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: palette.gray[600], fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: palette.gray[100] }}
              />
              <Bar
                dataKey="records"
                fill={palette.accent[500]}
                radius={[6, 6, 0, 0]}
                name="Records"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>
    </Grid>
  );
}
