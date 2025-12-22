/**
 * JobSidebar Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { JobSidebar } from './JobSidebar';
import { Box } from '@mui/material';

const meta: Meta<typeof JobSidebar> = {
  title: 'Features/Results/V3/JobSidebar',
  component: JobSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 600, display: 'flex' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobSidebar>;

const mockJobs = [
  { job_id: '1', job_name: 'CA_Foreclosure_Q4_2024', record_count: 15420, last_processed: '2024-12-22T10:30:00Z' },
  { job_id: '2', job_name: 'TX_Refinance_Dec_2024', record_count: 8750, last_processed: '2024-12-21T15:45:00Z' },
  { job_id: '3', job_name: 'FL_Purchase_Winter_2024', record_count: 12300, last_processed: '2024-12-20T09:15:00Z' },
  { job_id: '4', job_name: 'NY_HELOC_Nov_2024', record_count: 5680, last_processed: '2024-12-19T14:00:00Z' },
  { job_id: '5', job_name: 'AZ_Investment_Props', record_count: 3200, last_processed: '2024-12-18T11:30:00Z' },
];

export const Default: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: null,
    isLoading: false,
    isCollapsed: false,
    onSelectJob: (job) => console.log('Selected:', job.job_name),
    onToggleCollapse: () => console.log('Toggle collapse'),
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedJobId: '2',
  },
};

export const Collapsed: Story = {
  args: {
    ...Default.args,
    isCollapsed: true,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    jobs: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    jobs: [],
  },
};

const manyJobs = Array.from({ length: 20 }, (_, i) => ({
  job_id: `job-${i + 1}`,
  job_name: `Script_${String(i + 1).padStart(2, '0')}_${['CA', 'TX', 'FL', 'NY', 'AZ'][i % 5]}_Leads`,
  record_count: Math.floor(Math.random() * 20000) + 1000,
  last_processed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

export const ManyJobs: Story = {
  args: {
    jobs: manyJobs,
    selectedJobId: 'job-3',
    isLoading: false,
    isCollapsed: false,
    onSelectJob: (job) => console.log('Selected:', job.job_name),
    onToggleCollapse: () => console.log('Toggle collapse'),
  },
};
