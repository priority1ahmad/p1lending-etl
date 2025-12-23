import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { QuickStatsRow, type StatItem } from './QuickStatsRow';

const meta: Meta<typeof QuickStatsRow> = {
  title: 'Features/Home/QuickStatsRow',
  component: QuickStatsRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QuickStatsRow>;

const defaultStats: StatItem[] = [
  { id: '1', label: 'Total Processed', value: 45892, icon: 'jobs', color: 'info' },
  { id: '2', label: 'Clean', value: 38450, icon: 'clean', color: 'success' },
  { id: '3', label: 'Litigator', value: 4231, icon: 'litigator', color: 'warning' },
  { id: '4', label: 'DNC', value: 3211, icon: 'dnc', color: 'error' },
  { id: '5', label: 'Jobs Today', value: 12, icon: 'speed', color: 'default' },
];

/**
 * Default state with all stat types
 */
export const Default: Story = {
  args: {
    stats: defaultStats,
  },
};

/**
 * Compact mode for tighter layouts
 */
export const Compact: Story = {
  args: {
    stats: defaultStats,
    compact: true,
  },
};

/**
 * With trend indicators showing performance changes
 */
export const WithTrends: Story = {
  args: {
    stats: [
      {
        id: '1',
        label: 'Total Processed',
        value: 45892,
        icon: 'jobs',
        color: 'info',
        trend: 'up',
        trendValue: '+12%',
      },
      {
        id: '2',
        label: 'Clean',
        value: 38450,
        icon: 'clean',
        color: 'success',
        trend: 'up',
        trendValue: '+8%',
      },
      {
        id: '3',
        label: 'Litigator',
        value: 4231,
        icon: 'litigator',
        color: 'warning',
        trend: 'down',
        trendValue: '-3%',
      },
      {
        id: '4',
        label: 'DNC',
        value: 3211,
        icon: 'dnc',
        color: 'error',
        trend: 'neutral',
        trendValue: '0%',
      },
    ],
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    stats: defaultStats,
    isLoading: true,
  },
};

/**
 * Fewer stats (3 items)
 */
export const ThreeStats: Story = {
  args: {
    stats: [
      { id: '1', label: 'Clean', value: 12450, icon: 'clean', color: 'success' },
      { id: '2', label: 'Litigator', value: 234, icon: 'litigator', color: 'warning' },
      { id: '3', label: 'DNC', value: 89, icon: 'dnc', color: 'error' },
    ],
  },
};

/**
 * Large numbers formatted correctly
 */
export const LargeNumbers: Story = {
  args: {
    stats: [
      { id: '1', label: 'Total Records', value: 1234567, icon: 'jobs', color: 'info' },
      { id: '2', label: 'Clean', value: 987654, icon: 'clean', color: 'success' },
      { id: '3', label: 'Flagged', value: 246913, icon: 'litigator', color: 'warning' },
    ],
  },
};

/**
 * String values (for custom formatting)
 */
export const StringValues: Story = {
  args: {
    stats: [
      { id: '1', label: 'Processing Time', value: '2m 34s', icon: 'speed', color: 'info' },
      { id: '2', label: 'Success Rate', value: '94.2%', icon: 'clean', color: 'success' },
      { id: '3', label: 'Error Rate', value: '5.8%', icon: 'dnc', color: 'error' },
    ],
  },
};

/**
 * In context - shows how it looks in a dashboard layout
 */
export const InContext: Story = {
  decorators: [
    (Story) => (
      <Box
        sx={{
          p: 3,
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box
            component="h1"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              margin: 0,
            }}
          >
            ETL Dashboard
          </Box>
          <Box
            component="p"
            sx={{ color: '#666', fontSize: '0.875rem', margin: 0 }}
          >
            Monitor your data enrichment pipeline
          </Box>
        </Box>
        <Story />
      </Box>
    ),
  ],
  args: {
    stats: defaultStats,
    compact: true,
  },
};
