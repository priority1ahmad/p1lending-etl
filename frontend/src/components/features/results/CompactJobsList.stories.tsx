/**
 * CompactJobsList Stories
 * Storybook stories for the CompactJobsList component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompactJobsList } from './CompactJobsList';
import { Box } from '@mui/material';

const meta: Meta<typeof CompactJobsList> = {
  title: 'Features/Results/CompactJobsList',
  component: CompactJobsList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 300, height: 500 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompactJobsList>;

// Mock data
const mockJobs = [
  {
    job_id: 'abc123-def456-ghi789',
    job_name: 'CA_Foreclosure_Q4_2024',
    record_count: 15420,
    last_processed: '2024-12-22T10:30:00Z',
  },
  {
    job_id: 'xyz789-abc123-def456',
    job_name: 'TX_Refinance_Dec_2024',
    record_count: 8750,
    last_processed: '2024-12-21T15:45:00Z',
  },
  {
    job_id: 'def456-ghi789-jkl012',
    job_name: 'FL_Purchase_Winter_2024',
    record_count: 12300,
    last_processed: '2024-12-20T09:15:00Z',
  },
  {
    job_id: 'ghi789-jkl012-mno345',
    job_name: 'NY_HELOC_Nov_2024',
    record_count: 5680,
    last_processed: '2024-12-19T14:00:00Z',
  },
  {
    job_id: 'jkl012-mno345-pqr678',
    job_name: 'AZ_Investment_Properties',
    record_count: 3200,
    last_processed: '2024-12-18T11:30:00Z',
  },
];

// Default story - no selection
export const Default: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: null,
    isLoading: false,
    onSelectJob: (job) => console.log('Selected job:', job.job_name),
  },
};

// With a job selected
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedJobId: 'xyz789-abc123-def456',
  },
};

// Loading state
export const Loading: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    isLoading: true,
    onSelectJob: () => {},
  },
};

// Empty state - no jobs
export const Empty: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    isLoading: false,
    onSelectJob: () => {},
  },
};

// Many jobs - tests scrolling
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
    onSelectJob: (job) => console.log('Selected job:', job.job_name),
  },
};

// With search filter active (simulated)
export const SearchFiltering: Story = {
  args: {
    jobs: mockJobs.filter((j) => j.job_name.includes('CA')),
    selectedJobId: null,
    isLoading: false,
    onSelectJob: (job) => console.log('Selected job:', job.job_name),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows filtered results when user searches. In this example, only "CA" jobs are shown.',
      },
    },
  },
};

// Single job
export const SingleJob: Story = {
  args: {
    jobs: [mockJobs[0]],
    selectedJobId: mockJobs[0].job_id,
    isLoading: false,
    onSelectJob: (job) => console.log('Selected job:', job.job_name),
  },
};
