import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardMetricCard } from './DashboardMetricCard';
import {
  Folder,
  Dataset,
  CheckCircle,
  Warning,
  TrendingUp,
  Schedule,
  Speed,
  Error,
} from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { palette } from '../../../theme';

const meta: Meta<typeof DashboardMetricCard> = {
  title: 'Features/Dashboard/DashboardMetricCard',
  component: DashboardMetricCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Metric title/label',
    },
    value: {
      control: 'text',
      description: 'Metric value (number or string)',
    },
    suffix: {
      control: 'text',
      description: 'Optional suffix (%, records, etc.)',
    },
    color: {
      control: 'color',
      description: 'Icon and accent color',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading skeleton',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardMetricCard>;

// Basic Examples
export const TotalJobs: Story = {
  args: {
    title: 'Total Jobs',
    value: 42,
    icon: <Folder />,
    color: palette.primary[800],
  },
};

export const TotalRecords: Story = {
  args: {
    title: 'Total Records',
    value: 45234,
    icon: <Dataset />,
    color: palette.accent[500],
  },
};

export const SuccessRate: Story = {
  args: {
    title: 'Success Rate',
    value: 98.5,
    suffix: '%',
    icon: <CheckCircle />,
    color: palette.success[500],
  },
};

export const ActiveJobs: Story = {
  args: {
    title: 'Active Jobs',
    value: 3,
    icon: <TrendingUp />,
    color: palette.accent[600],
  },
};

// With Trends
export const WithPositiveTrend: Story = {
  args: {
    title: 'Success Rate',
    value: 98.5,
    suffix: '%',
    icon: <CheckCircle />,
    color: palette.success[500],
    trend: {
      value: 2.5,
      direction: 'up',
    },
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Error Rate',
    value: 1.5,
    suffix: '%',
    icon: <Error />,
    color: palette.error[500],
    trend: {
      value: 0.3,
      direction: 'down',
    },
  },
};

export const LargeNumber: Story = {
  args: {
    title: 'Records Processed',
    value: 1234567,
    icon: <Speed />,
    color: palette.accent[500],
    trend: {
      value: 12.3,
      direction: 'up',
    },
  },
};

// Different States
export const Loading: Story = {
  args: {
    title: 'Loading Metric',
    value: 0,
    icon: <Schedule />,
    color: palette.gray[500],
    isLoading: true,
  },
};

export const StringValue: Story = {
  args: {
    title: 'Current Status',
    value: 'Running',
    icon: <TrendingUp />,
    color: palette.accent[500],
  },
};

export const WithSuffix: Story = {
  args: {
    title: 'Clean Records',
    value: 42350,
    suffix: 'records',
    icon: <CheckCircle />,
    color: palette.success[500],
  },
};

export const ComplianceMetric: Story = {
  args: {
    title: 'Litigators Found',
    value: 234,
    suffix: 'flagged',
    icon: <Warning />,
    color: palette.warning[500],
  },
};

// Clickable
export const Clickable: Story = {
  args: {
    title: 'View Details',
    value: 42,
    icon: <Folder />,
    color: palette.primary[800],
    onClick: () => alert('Card clicked!'),
  },
};

// Grid Layout Showcase
export const DashboardMetricsGrid: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard Metrics Example
      </Typography>
      <Grid container spacing={3}>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardMetricCard
            title="Active Jobs"
            value={3}
            icon={<TrendingUp />}
            color={palette.accent[500]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardMetricCard
            title="Completed Today"
            value={12}
            icon={<CheckCircle />}
            color={palette.success[500]}
            trend={{ value: 8.5, direction: 'up' }}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardMetricCard
            title="Total Records"
            value={45234}
            icon={<Dataset />}
            color={palette.primary[800]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardMetricCard
            title="Success Rate"
            value={98.5}
            suffix="%"
            icon={<Speed />}
            color={palette.success[600]}
            trend={{ value: 2.3, direction: 'up' }}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// All Colors Showcase
export const ColorVariations: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Color Variations
      </Typography>
      <Grid container spacing={2}>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Primary Color"
            value={100}
            icon={<Folder />}
            color={palette.primary[800]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Accent Color"
            value={200}
            icon={<Dataset />}
            color={palette.accent[500]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Success Color"
            value={300}
            icon={<CheckCircle />}
            color={palette.success[500]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Warning Color"
            value={400}
            icon={<Warning />}
            color={palette.warning[500]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Error Color"
            value={500}
            icon={<Error />}
            color={palette.error[500]}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardMetricCard
            title="Gray Color"
            value={600}
            icon={<Schedule />}
            color={palette.gray[500]}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// Responsive Test
export const ResponsiveGrid: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Responsive Grid (Resize window to see effect)
      </Typography>
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          /* @ts-expect-error - MUI v7 Grid item prop */
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <DashboardMetricCard
              title={`Metric ${i}`}
              value={i * 1000}
              icon={<Dataset />}
              color={
                i % 3 === 0
                  ? palette.primary[800]
                  : i % 2 === 0
                  ? palette.accent[500]
                  : palette.success[500]
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  ),
};
