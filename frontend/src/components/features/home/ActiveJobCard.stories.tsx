import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { ActiveJobCard } from './ActiveJobCard';

const meta: Meta<typeof ActiveJobCard> = {
  title: 'Features/Home/ActiveJobCard',
  component: ActiveJobCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActiveJobCard>;

/**
 * Job just started - low progress
 */
export const JustStarted: Story = {
  args: {
    jobId: 'job-123',
    scriptName: 'Daily Leads - California',
    progress: 5,
    currentRow: 50,
    totalRows: 1000,
    currentBatch: 1,
    totalBatches: 10,
    message: 'Initializing idiCORE connection...',
    elapsedTime: 12,
    onStop: () => console.log('Stop clicked'),
    onViewDetails: () => console.log('View details clicked'),
  },
};

/**
 * Mid-way through processing
 */
export const MidProgress: Story = {
  args: {
    jobId: 'job-123',
    scriptName: 'Weekly Refinance Pool',
    progress: 45,
    currentRow: 450,
    totalRows: 1000,
    currentBatch: 5,
    totalBatches: 10,
    message: 'Processing idiCORE enrichment...',
    elapsedTime: 180,
    timeRemaining: '4m 30s',
    stats: {
      clean: 380,
      litigator: 45,
      dnc: 25,
    },
    onStop: () => console.log('Stop clicked'),
    onViewDetails: () => console.log('View details clicked'),
  },
};

/**
 * Nearly complete
 */
export const NearlyComplete: Story = {
  args: {
    jobId: 'job-123',
    scriptName: 'High Value Prospects',
    progress: 92,
    currentRow: 920,
    totalRows: 1000,
    currentBatch: 10,
    totalBatches: 10,
    message: 'Finalizing DNC checks...',
    elapsedTime: 420,
    timeRemaining: '30s',
    stats: {
      clean: 756,
      litigator: 98,
      dnc: 66,
    },
    onStop: () => console.log('Stop clicked'),
    onViewDetails: () => console.log('View details clicked'),
  },
};

/**
 * Upload phase
 */
export const Uploading: Story = {
  args: {
    jobId: 'job-123',
    scriptName: 'FHA Candidates',
    progress: 100,
    currentRow: 1000,
    totalRows: 1000,
    currentBatch: 10,
    totalBatches: 10,
    message: 'Uploading results to Snowflake...',
    elapsedTime: 480,
    stats: {
      clean: 850,
      litigator: 100,
      dnc: 50,
    },
    onStop: () => console.log('Stop clicked'),
  },
};

/**
 * Large batch processing
 */
export const LargeBatch: Story = {
  args: {
    jobId: 'job-456',
    scriptName: 'Monthly Full Export',
    progress: 23,
    currentRow: 23456,
    totalRows: 102000,
    currentBatch: 24,
    totalBatches: 102,
    message: 'Processing batch 24 of 102...',
    elapsedTime: 1800,
    timeRemaining: '58m 12s',
    stats: {
      clean: 19234,
      litigator: 2845,
      dnc: 1377,
    },
    onStop: () => console.log('Stop clicked'),
    onViewDetails: () => console.log('View details clicked'),
  },
};

/**
 * Currently stopping
 */
export const Stopping: Story = {
  args: {
    jobId: 'job-123',
    scriptName: 'Daily Leads - California',
    progress: 45,
    currentRow: 450,
    totalRows: 1000,
    currentBatch: 5,
    totalBatches: 10,
    message: 'Stopping job...',
    elapsedTime: 180,
    stats: {
      clean: 380,
      litigator: 45,
      dnc: 25,
    },
    onStop: () => console.log('Stop clicked'),
    isStopping: true,
  },
};

/**
 * Without stats (early processing)
 */
export const WithoutStats: Story = {
  args: {
    jobId: 'job-789',
    scriptName: 'New Script Test',
    progress: 8,
    currentRow: 80,
    totalRows: 1000,
    currentBatch: 1,
    totalBatches: 10,
    message: 'Querying Snowflake for lead data...',
    elapsedTime: 24,
    onStop: () => console.log('Stop clicked'),
  },
};

/**
 * Minimal info (no batches, no ETA)
 */
export const MinimalInfo: Story = {
  args: {
    jobId: 'job-simple',
    scriptName: 'Quick Test Script',
    progress: 33,
    currentRow: 33,
    totalRows: 100,
    message: 'Processing...',
    elapsedTime: 45,
    onStop: () => console.log('Stop clicked'),
  },
};

/**
 * In context - shows placement in dashboard layout
 */
export const InContext: Story = {
  decorators: [
    (Story) => (
      <Box
        sx={{
          p: 3,
          backgroundColor: '#f8f9fa',
          minHeight: 400,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box
            component="h2"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Active Job
          </Box>
        </Box>
        <Story />
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            backgroundColor: '#fff',
          }}
        >
          <Box
            component="span"
            sx={{ color: '#666', fontSize: '0.75rem' }}
          >
            Other dashboard content would go here...
          </Box>
        </Box>
      </Box>
    ),
  ],
  args: {
    jobId: 'job-123',
    scriptName: 'Daily Leads - California',
    progress: 45,
    currentRow: 450,
    totalRows: 1000,
    currentBatch: 5,
    totalBatches: 10,
    message: 'Processing idiCORE enrichment...',
    elapsedTime: 180,
    timeRemaining: '4m 30s',
    stats: {
      clean: 380,
      litigator: 45,
      dnc: 25,
    },
    onStop: () => console.log('Stop clicked'),
    onViewDetails: () => console.log('View details clicked'),
  },
};
