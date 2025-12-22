import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProcessingTrendsChart } from './ProcessingTrendsChart';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof ProcessingTrendsChart> = {
  title: 'Features/Dashboard/ProcessingTrendsChart',
  component: ProcessingTrendsChart,
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
    showJobs: {
      control: 'boolean',
      description: 'Show jobs bar alongside records',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    height: {
      control: 'number',
      description: 'Chart height in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProcessingTrendsChart>;

// Sample data
const last7Days = [
  { date: 'Mon', records: 1200, jobs: 4 },
  { date: 'Tue', records: 1500, jobs: 6 },
  { date: 'Wed', records: 1100, jobs: 5 },
  { date: 'Thu', records: 1800, jobs: 7 },
  { date: 'Fri', records: 2100, jobs: 8 },
  { date: 'Sat', records: 900, jobs: 3 },
  { date: 'Sun', records: 700, jobs: 2 },
];

const last30Days = [
  { date: 'Dec 1', records: 12000, jobs: 25 },
  { date: 'Dec 5', records: 15000, jobs: 30 },
  { date: 'Dec 10', records: 18000, jobs: 35 },
  { date: 'Dec 15', records: 14000, jobs: 28 },
  { date: 'Dec 20', records: 19000, jobs: 38 },
  { date: 'Dec 25', records: 11000, jobs: 22 },
  { date: 'Dec 30', records: 16000, jobs: 32 },
];

const hourlyData = [
  { date: '9AM', records: 150 },
  { date: '10AM', records: 280 },
  { date: '11AM', records: 320 },
  { date: '12PM', records: 290 },
  { date: '1PM', records: 250 },
  { date: '2PM', records: 310 },
  { date: '3PM', records: 340 },
  { date: '4PM', records: 280 },
  { date: '5PM', records: 190 },
];

const sparseData = [
  { date: 'Mon', records: 50, jobs: 1 },
  { date: 'Tue', records: 30, jobs: 1 },
  { date: 'Wed', records: 20, jobs: 0 },
];

// Basic Examples
export const SevenDayTrend: Story = {
  args: {
    title: '7-Day Processing Trend',
    subtitle: 'Records processed per day',
    data: last7Days,
  },
};

export const ThirtyDayTrend: Story = {
  args: {
    title: '30-Day Processing Trend',
    subtitle: 'Records processed (5-day intervals)',
    data: last30Days,
  },
};

export const HourlyTrend: Story = {
  args: {
    title: 'Today\'s Processing',
    subtitle: 'Records processed per hour',
    data: hourlyData,
  },
};

export const WithJobsBar: Story = {
  args: {
    title: '7-Day Processing Trend',
    subtitle: 'Records and jobs processed per day',
    data: last7Days,
    showJobs: true,
  },
};

// States
export const Loading: Story = {
  args: {
    title: '7-Day Processing Trend',
    subtitle: 'Loading data...',
    data: last7Days,
    isLoading: true,
  },
};

export const NoData: Story = {
  args: {
    title: '7-Day Processing Trend',
    subtitle: 'No processing data available',
    data: [],
  },
};

export const SparseData: Story = {
  args: {
    title: 'Processing Activity',
    subtitle: 'Low activity period',
    data: sparseData,
  },
};

// Layout Variations
export const CustomHeight: Story = {
  args: {
    title: 'Tall Chart',
    subtitle: 'Custom 400px height',
    data: last7Days,
    height: 400,
  },
};

export const CompactHeight: Story = {
  args: {
    title: 'Compact Chart',
    subtitle: 'Custom 200px height',
    data: last7Days,
    height: 200,
  },
};

export const NoTitle: Story = {
  args: {
    data: last7Days,
  },
};

// Full Dashboard Context
export const InDashboardLayout: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard Analytics
      </Typography>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <ProcessingTrendsChart
          title="7-Day Processing Trend"
          subtitle="Daily record processing volume"
          data={last7Days}
          showJobs
        />
        <ProcessingTrendsChart
          title="Today's Hourly Breakdown"
          subtitle="Records processed per hour"
          data={hourlyData}
          height={250}
        />
      </Box>
    </Box>
  ),
};

// Responsive Grid
export const TwoChartComparison: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      <ProcessingTrendsChart
        title="Last 7 Days"
        data={last7Days}
        showJobs
        height={250}
      />
      <ProcessingTrendsChart
        title="Last 30 Days"
        data={last30Days}
        showJobs
        height={250}
      />
    </Box>
  ),
};
