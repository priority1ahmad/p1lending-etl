import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['running', 'completed', 'failed', 'cancelled', 'pending', 'clean', 'litigator', 'dnc', 'both'],
      description: 'Status value',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show status icon',
    },
    label: {
      control: 'text',
      description: 'Custom label (overrides default)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// Job Statuses
export const Running: Story = {
  args: {
    status: 'running',
    showIcon: false,
  },
};

export const RunningWithIcon: Story = {
  args: {
    status: 'running',
    showIcon: true,
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
    showIcon: false,
  },
};

export const CompletedWithIcon: Story = {
  args: {
    status: 'completed',
    showIcon: true,
  },
};

export const Failed: Story = {
  args: {
    status: 'failed',
    showIcon: false,
  },
};

export const FailedWithIcon: Story = {
  args: {
    status: 'failed',
    showIcon: true,
  },
};

export const Cancelled: Story = {
  args: {
    status: 'cancelled',
    showIcon: false,
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
    showIcon: false,
  },
};

// Compliance Statuses
export const Clean: Story = {
  args: {
    status: 'clean',
    showIcon: false,
  },
};

export const CleanWithIcon: Story = {
  args: {
    status: 'clean',
    showIcon: true,
  },
};

export const Litigator: Story = {
  args: {
    status: 'litigator',
    showIcon: false,
  },
};

export const LitigatorWithIcon: Story = {
  args: {
    status: 'litigator',
    showIcon: true,
  },
};

export const DNC: Story = {
  args: {
    status: 'dnc',
    showIcon: false,
  },
};

export const DNCWithIcon: Story = {
  args: {
    status: 'dnc',
    showIcon: true,
  },
};

export const Both: Story = {
  args: {
    status: 'both',
    showIcon: false,
  },
};

export const BothWithIcon: Story = {
  args: {
    status: 'both',
    showIcon: true,
  },
};

// Custom Label
export const CustomLabel: Story = {
  args: {
    status: 'completed',
    label: 'Done ✓',
    showIcon: false,
  },
};

// Unknown Status
export const UnknownStatus: Story = {
  args: {
    status: 'custom-status',
    showIcon: false,
  },
};

// All job statuses showcase
export const AllJobStatuses: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Job Statuses (No Icon)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="running" />
          <StatusBadge status="completed" />
          <StatusBadge status="failed" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="pending" />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Job Statuses (With Icon)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="running" showIcon />
          <StatusBadge status="completed" showIcon />
          <StatusBadge status="failed" showIcon />
          <StatusBadge status="cancelled" showIcon />
          <StatusBadge status="pending" showIcon />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Compliance Statuses (No Icon)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="clean" />
          <StatusBadge status="litigator" />
          <StatusBadge status="dnc" />
          <StatusBadge status="both" />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Compliance Statuses (With Icon)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="clean" showIcon />
          <StatusBadge status="litigator" showIcon />
          <StatusBadge status="dnc" showIcon />
          <StatusBadge status="both" showIcon />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Custom Labels
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="completed" label="Success" showIcon />
          <StatusBadge status="running" label="In Progress" showIcon />
          <StatusBadge status="failed" label="Error" showIcon />
        </Box>
      </Box>
    </Box>
  ),
};

// In context example
export const InContext: Story = {
  render: () => (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        ETL Job #12345
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Status:
        </Typography>
        <StatusBadge status="running" showIcon />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Records Processed:
        </Typography>
        <Typography variant="body1">1,234 / 5,000</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Clean:
        </Typography>
        <StatusBadge status="clean" showIcon />
        <Typography variant="body2" color="text.secondary">
          950
        </Typography>
        <StatusBadge status="dnc" showIcon />
        <Typography variant="body2" color="text.secondary">
          200
        </Typography>
        <StatusBadge status="litigator" showIcon />
        <Typography variant="body2" color="text.secondary">
          84
        </Typography>
      </Box>
    </Box>
  ),
};
