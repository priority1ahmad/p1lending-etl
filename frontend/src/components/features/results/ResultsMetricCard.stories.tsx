import type { Meta, StoryObj } from '@storybook/react';
import { ResultsMetricCard } from './ResultsMetricCard';
import { Box, Typography, GridLegacy as Grid } from '@mui/material';
import { palette } from '../../../theme';

const meta: Meta<typeof ResultsMetricCard> = {
  title: 'Features/Results/ResultsMetricCard',
  component: ResultsMetricCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title/label',
    },
    value: {
      control: 'text',
      description: 'Metric value (number or formatted string)',
    },
    suffix: {
      control: 'text',
      description: 'Optional suffix for value (e.g., "%", "total")',
    },
    color: {
      control: 'color',
      description: 'Accent color (use palette colors)',
    },
    trend: {
      control: 'number',
      description: 'Optional trend percentage (positive or negative)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsMetricCard>;

// ============================================
// BASIC EXAMPLES
// ============================================

export const TotalRecords: Story = {
  args: {
    title: 'Total Records',
    value: 5000,
    color: palette.primary[800],
  },
};

export const CleanRecords: Story = {
  args: {
    title: 'Clean Records',
    value: 4565,
    color: palette.success[500],
  },
};

export const LitigatorCount: Story = {
  args: {
    title: 'Litigators',
    value: 234,
    color: palette.warning[500],
  },
};

export const DNCCount: Story = {
  args: {
    title: 'DNC List',
    value: 156,
    color: palette.error[500],
  },
};

export const BothFlagsCount: Story = {
  args: {
    title: 'Both Flags',
    value: 45,
    color: palette.error[600],
  },
};

// ============================================
// WITH SUFFIX
// ============================================

export const CleanPercentage: Story = {
  args: {
    title: 'Clean Rate',
    value: 91.3,
    suffix: '%',
    color: palette.success[600],
  },
};

export const ProcessingSpeed: Story = {
  args: {
    title: 'Processing Speed',
    value: 250,
    suffix: 'records/sec',
    color: palette.accent[500],
  },
};

export const TotalUsers: Story = {
  args: {
    title: 'Total Users',
    value: 1234,
    suffix: 'contacts',
    color: palette.primary[700],
  },
};

// ============================================
// WITH TRENDS
// ============================================

export const WithPositiveTrend: Story = {
  args: {
    title: 'Clean Records',
    value: 4565,
    color: palette.success[500],
    trend: 12.5,
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Litigators',
    value: 234,
    color: palette.warning[500],
    trend: -5.2,
  },
};

export const WithZeroTrend: Story = {
  args: {
    title: 'DNC Count',
    value: 156,
    color: palette.error[500],
    trend: 0,
  },
};

export const LargePositiveTrend: Story = {
  args: {
    title: 'Total Records',
    value: 5000,
    color: palette.primary[800],
    trend: 45.8,
  },
};

export const WithTrendAndSuffix: Story = {
  args: {
    title: 'Clean Rate',
    value: 91.3,
    suffix: '%',
    color: palette.success[600],
    trend: 3.7,
  },
};

// ============================================
// DIFFERENT VALUE TYPES
// ============================================

export const LargeNumber: Story = {
  args: {
    title: 'Total Processed',
    value: 1234567,
    color: palette.accent[500],
  },
};

export const StringValue: Story = {
  args: {
    title: 'Current Status',
    value: 'Running',
    color: palette.accent[600],
  },
};

export const DecimalValue: Story = {
  args: {
    title: 'Avg Processing Time',
    value: 2.45,
    suffix: 'seconds',
    color: palette.primary[700],
  },
};

export const ZeroValue: Story = {
  args: {
    title: 'Errors Found',
    value: 0,
    color: palette.success[500],
  },
};

// ============================================
// COLOR VARIATIONS
// ============================================

export const ColorVariations: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        All Color Variations
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Primary Color"
            value={100}
            color={palette.primary[800]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Accent Color"
            value={200}
            color={palette.accent[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Success Color"
            value={300}
            color={palette.success[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Warning Color"
            value={400}
            color={palette.warning[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Error Color"
            value={500}
            color={palette.error[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResultsMetricCard
            title="Gray Color"
            value={600}
            color={palette.gray[500]}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// ============================================
// IN CONTEXT - RESULTS PAGE
// ============================================

export const ResultsPageMetrics: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        ETL Results Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <ResultsMetricCard
            title="Total Records"
            value={5000}
            color={palette.primary[800]}
            trend={8.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResultsMetricCard
            title="Clean Records"
            value={4565}
            color={palette.success[500]}
            trend={12.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResultsMetricCard
            title="Litigators"
            value={234}
            color={palette.warning[500]}
            trend={-3.4}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResultsMetricCard
            title="DNC List"
            value={156}
            color={palette.error[500]}
            trend={-5.2}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Additional Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <ResultsMetricCard
              title="Clean Rate"
              value={91.3}
              suffix="%"
              color={palette.success[600]}
              trend={3.7}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ResultsMetricCard
              title="Both Flags"
              value={45}
              color={palette.error[600]}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ResultsMetricCard
              title="Processing Speed"
              value={250}
              suffix="rec/sec"
              color={palette.accent[500]}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  ),
};

// ============================================
// RESPONSIVE GRID
// ============================================

export const ResponsiveGrid: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Responsive Grid (Resize window to see effect)
      </Typography>
      <Grid container spacing={3}>
        {[
          { title: 'Metric 1', value: 1000, color: palette.primary[800] },
          { title: 'Metric 2', value: 2000, color: palette.success[500] },
          { title: 'Metric 3', value: 3000, color: palette.warning[500] },
          { title: 'Metric 4', value: 4000, color: palette.error[500] },
          { title: 'Metric 5', value: 5000, color: palette.accent[500] },
          { title: 'Metric 6', value: 6000, color: palette.primary[700] },
        ].map((metric, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <ResultsMetricCard
              title={metric.title}
              value={metric.value}
              color={metric.color}
              trend={i % 2 === 0 ? 5.5 : -2.3}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  ),
};

// ============================================
// COMPACT GRID
// ============================================

export const CompactTwoColumn: Story = {
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Compact Two-Column Layout
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <ResultsMetricCard
            title="Clean"
            value={4565}
            color={palette.success[500]}
          />
        </Grid>
        <Grid item xs={6}>
          <ResultsMetricCard
            title="Flagged"
            value={435}
            color={palette.warning[500]}
          />
        </Grid>
        <Grid item xs={6}>
          <ResultsMetricCard
            title="Rate"
            value={91.3}
            suffix="%"
            color={palette.primary[700]}
          />
        </Grid>
        <Grid item xs={6}>
          <ResultsMetricCard
            title="Speed"
            value={250}
            suffix="rec/s"
            color={palette.accent[500]}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};
