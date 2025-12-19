import type { Meta, StoryObj } from '@storybook/react';
import { ComplianceDonutChart } from './ComplianceDonutChart';
import { Box, Grid, Typography } from '@mui/material';

const meta: Meta<typeof ComplianceDonutChart> = {
  title: 'Features/Dashboard/ComplianceDonutChart',
  component: ComplianceDonutChart,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Chart title',
    },
    subtitle: {
      control: 'text',
      description: 'Chart subtitle/description',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    size: {
      control: 'number',
      description: 'Chart size in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComplianceDonutChart>;

// Sample data sets
const highComplianceData = {
  clean: 8500,
  litigator: 120,
  dnc: 280,
  both: 100,
};

const lowComplianceData = {
  clean: 1200,
  litigator: 450,
  dnc: 680,
  both: 270,
};

const perfectData = {
  clean: 10000,
  litigator: 0,
  dnc: 0,
  both: 0,
};

const poorData = {
  clean: 500,
  litigator: 2000,
  dnc: 1500,
  both: 1000,
};

const balancedData = {
  clean: 2500,
  litigator: 2500,
  dnc: 2500,
  both: 2500,
};

// Basic Examples
export const HighCompliance: Story = {
  args: {
    title: 'Compliance Overview',
    subtitle: '94.4% clean records',
    data: highComplianceData,
  },
};

export const LowCompliance: Story = {
  args: {
    title: 'Compliance Overview',
    subtitle: '47.6% clean records',
    data: lowComplianceData,
  },
};

export const PerfectCompliance: Story = {
  args: {
    title: 'Perfect Compliance',
    subtitle: '100% clean records',
    data: perfectData,
  },
};

export const PoorCompliance: Story = {
  args: {
    title: 'Compliance Issues Detected',
    subtitle: 'Only 10% clean records',
    data: poorData,
  },
};

export const BalancedDistribution: Story = {
  args: {
    title: 'Balanced Distribution',
    subtitle: 'Equal split across categories',
    data: balancedData,
  },
};

// States
export const Loading: Story = {
  args: {
    title: 'Compliance Overview',
    subtitle: 'Loading data...',
    data: highComplianceData,
    isLoading: true,
  },
};

export const NoData: Story = {
  args: {
    title: 'Compliance Overview',
    subtitle: 'No data available',
    data: {
      clean: 0,
      litigator: 0,
      dnc: 0,
      both: 0,
    },
  },
};

// Layout Variations
export const LargeChart: Story = {
  args: {
    title: 'Large Compliance Chart',
    subtitle: '400px size',
    data: highComplianceData,
    size: 400,
  },
};

export const CompactChart: Story = {
  args: {
    title: 'Compact Chart',
    subtitle: '200px size',
    data: highComplianceData,
    size: 200,
  },
};

export const NoTitle: Story = {
  args: {
    data: highComplianceData,
  },
};

// Dashboard Context
export const InDashboardLayout: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Compliance Analytics
      </Typography>
      <Grid container spacing={3}>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} md={6}>
          <ComplianceDonutChart
            title="Overall Compliance"
            subtitle="All-time records"
            data={highComplianceData}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} md={6}>
          <ComplianceDonutChart
            title="This Month"
            subtitle="December 2024"
            data={lowComplianceData}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// Comparison View
export const MultipleCharts: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Compliance Comparison
      </Typography>
      <Grid container spacing={2}>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <ComplianceDonutChart
            title="Perfect"
            subtitle="100% clean"
            data={perfectData}
            size={200}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <ComplianceDonutChart
            title="High"
            subtitle="94% clean"
            data={highComplianceData}
            size={200}
          />
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <ComplianceDonutChart
            title="Low"
            subtitle="48% clean"
            data={lowComplianceData}
            size={200}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// Real-world Scenarios
export const RealisticScenario: Story = {
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        December 2024 Report
      </Typography>
      <ComplianceDonutChart
        title="Monthly Compliance Breakdown"
        subtitle="42,350 total records processed"
        data={{
          clean: 39150,
          litigator: 1250,
          dnc: 1680,
          both: 270,
        }}
      />
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Analysis:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          92.4% of records are clean and compliant. 3.0% are flagged as
          litigators, 4.0% are on DNC lists, and 0.6% appear on both lists.
        </Typography>
      </Box>
    </Box>
  ),
};
