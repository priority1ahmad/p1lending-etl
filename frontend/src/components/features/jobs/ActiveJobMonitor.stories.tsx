import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActiveJobMonitor } from './ActiveJobMonitor';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof ActiveJobMonitor> = {
  title: 'Features/Jobs/ActiveJobMonitor',
  component: ActiveJobMonitor,
  tags: ['autodocs'],
  argTypes: {
    jobName: {
      control: 'text',
      description: 'Job name/identifier',
    },
    status: {
      control: 'select',
      options: ['running', 'completed', 'failed', 'cancelled'],
      description: 'Job status',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActiveJobMonitor>;

// Sample progress data
const earlyProgress = {
  currentRow: 150,
  totalRows: 5000,
  currentBatch: 1,
  totalBatches: 12,
  progress: 3,
  message: 'Initializing batch processing...',
  stats: {
    clean: 140,
    litigator: 7,
    dnc: 3,
  },
};

const midProgress = {
  currentRow: 2500,
  totalRows: 5000,
  currentBatch: 6,
  totalBatches: 12,
  progress: 50,
  message: 'Processing batch 6 of 12...',
  stats: {
    clean: 2100,
    litigator: 280,
    dnc: 120,
  },
};

const lateProgress = {
  currentRow: 4800,
  totalRows: 5000,
  currentBatch: 11,
  totalBatches: 12,
  progress: 96,
  message: 'Finalizing processing...',
  stats: {
    clean: 4200,
    litigator: 420,
    dnc: 180,
  },
};

// Basic Examples
export const Running_Early: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'running',
    progress: earlyProgress,
    onStop: () => alert('Stop job clicked'),
    onRefresh: () => alert('Refresh clicked'),
  },
};

export const Running_MidProgress: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'running',
    progress: midProgress,
    onStop: () => alert('Stop job clicked'),
  },
};

export const Running_AlmostDone: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'running',
    progress: lateProgress,
    onStop: () => alert('Stop job clicked'),
  },
};

export const RunningWithoutBatch: Story = {
  args: {
    jobName: 'Small Test Job',
    status: 'running',
    progress: {
      currentRow: 50,
      totalRows: 100,
      progress: 50,
      message: 'Processing records...',
    },
    onStop: () => alert('Stop job clicked'),
  },
};

// States
export const Completed: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'completed',
  },
};

export const Failed: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'failed',
  },
};

export const Cancelled: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'cancelled',
  },
};

export const Loading: Story = {
  args: {
    jobName: 'Daily Leads Processing',
    status: 'running',
    progress: midProgress,
    isLoading: true,
  },
};

// Large Numbers
export const LargeDataset: Story = {
  args: {
    jobName: 'Monthly Full Processing',
    status: 'running',
    progress: {
      currentRow: 125000,
      totalRows: 500000,
      currentBatch: 25,
      totalBatches: 100,
      progress: 25,
      message: 'Processing large dataset...',
      stats: {
        clean: 112000,
        litigator: 8500,
        dnc: 4500,
      },
    },
    onStop: () => alert('Stop job clicked'),
  },
};

// In Page Context
export const InJobManagementPage: Story = {
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        Job Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor active ETL job processing
      </Typography>

      <ActiveJobMonitor
        jobName="Daily Leads - All States"
        status="running"
        progress={midProgress}
        onStop={() => console.log('Stop job')}
        onRefresh={() => console.log('Refresh')}
      />

      <Box sx={{ mt: 3, p: 2, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Real-time Updates:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This component receives live updates via WebSocket connection.
          Progress bar, statistics, and batch information update automatically
          as the job processes records.
        </Typography>
      </Box>
    </Box>
  ),
};

// Multiple Jobs
export const MultipleJobsMonitoring: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Active Jobs
      </Typography>

      <ActiveJobMonitor
        jobName="High Priority - CA Leads"
        status="running"
        progress={{
          ...lateProgress,
          message: 'Almost complete...',
        }}
        onStop={() => console.log('Stop job 1')}
      />

      <ActiveJobMonitor
        jobName="Background - TX Leads"
        status="running"
        progress={{
          ...midProgress,
          currentRow: 1200,
          totalRows: 3000,
          progress: 40,
        }}
        onStop={() => console.log('Stop job 2')}
      />

      <ActiveJobMonitor
        jobName="Test Run - Sample Data"
        status="running"
        progress={{
          ...earlyProgress,
          totalRows: 100,
          currentRow: 10,
          progress: 10,
        }}
        onStop={() => console.log('Stop job 3')}
      />
    </Box>
  ),
};

// Progress Stages
export const ProgressionStages: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Job Progress Stages
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Stage 1: Starting (3%)
          </Typography>
          <ActiveJobMonitor
            jobName="Daily Leads"
            status="running"
            progress={earlyProgress}
          />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Stage 2: In Progress (50%)
          </Typography>
          <ActiveJobMonitor
            jobName="Daily Leads"
            status="running"
            progress={midProgress}
          />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Stage 3: Finishing (96%)
          </Typography>
          <ActiveJobMonitor
            jobName="Daily Leads"
            status="running"
            progress={lateProgress}
          />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Stage 4: Completed
          </Typography>
          <ActiveJobMonitor jobName="Daily Leads" status="completed" />
        </Box>
      </Box>
    </Box>
  ),
};
