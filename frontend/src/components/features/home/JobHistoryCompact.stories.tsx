import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { JobHistoryCompact, type JobHistoryItem } from './JobHistoryCompact';

const meta: Meta<typeof JobHistoryCompact> = {
  title: 'Features/Home/JobHistoryCompact',
  component: JobHistoryCompact,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobHistoryCompact>;

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 3600000);
const twoHoursAgo = new Date(now.getTime() - 7200000);
const yesterday = new Date(now.getTime() - 86400000);
const twoDaysAgo = new Date(now.getTime() - 172800000);

const sampleJobs: JobHistoryItem[] = [
  {
    id: '1',
    job_type: 'single_script',
    script_name: 'Daily Leads - California',
    status: 'completed',
    total_rows_processed: 1234,
    litigator_count: 89,
    dnc_count: 45,
    clean_count: 1100,
    started_at: oneHourAgo.toISOString(),
    completed_at: now.toISOString(),
    duration: 420,
  },
  {
    id: '2',
    job_type: 'preview',
    script_name: 'Weekly Refinance Pool',
    status: 'completed',
    total_rows_processed: 500,
    started_at: twoHoursAgo.toISOString(),
    duration: 30,
  },
  {
    id: '3',
    job_type: 'single_script',
    script_name: 'High Value Prospects',
    status: 'failed',
    total_rows_processed: 234,
    started_at: yesterday.toISOString(),
    duration: 156,
  },
  {
    id: '4',
    job_type: 'single_script',
    script_name: 'FHA Candidates',
    status: 'cancelled',
    total_rows_processed: 100,
    started_at: yesterday.toISOString(),
    duration: 60,
  },
  {
    id: '5',
    job_type: 'single_script',
    script_name: 'Monthly Full Export',
    status: 'completed',
    total_rows_processed: 45678,
    litigator_count: 3421,
    dnc_count: 1876,
    clean_count: 40381,
    started_at: twoDaysAgo.toISOString(),
    duration: 7200,
  },
  {
    id: '6',
    job_type: 'preview',
    script_name: 'Test Script',
    status: 'completed',
    total_rows_processed: 50,
    started_at: twoDaysAgo.toISOString(),
    duration: 15,
  },
];

/**
 * Default with recent jobs
 */
export const Default: Story = {
  args: {
    jobs: sampleJobs,
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};

/**
 * Limited to 3 items
 */
export const LimitedItems: Story = {
  args: {
    jobs: sampleJobs,
    maxItems: 3,
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};

/**
 * Empty state - no jobs yet
 */
export const Empty: Story = {
  args: {
    jobs: [],
    onViewAll: () => console.log('View all clicked'),
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    jobs: [],
    isLoading: true,
  },
};

/**
 * All completed jobs
 */
export const AllCompleted: Story = {
  args: {
    jobs: sampleJobs.filter((j) => j.status === 'completed'),
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};

/**
 * With running job
 */
export const WithRunningJob: Story = {
  args: {
    jobs: [
      {
        id: 'running-1',
        job_type: 'single_script',
        script_name: 'Processing Now',
        status: 'running',
        total_rows_processed: 456,
        started_at: new Date().toISOString(),
      },
      ...sampleJobs.slice(0, 4),
    ],
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
  },
};

/**
 * With pending job
 */
export const WithPendingJob: Story = {
  args: {
    jobs: [
      {
        id: 'pending-1',
        job_type: 'single_script',
        script_name: 'Queued Job',
        status: 'pending',
        started_at: new Date().toISOString(),
      },
      ...sampleJobs.slice(0, 4),
    ],
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
  },
};

/**
 * Only previews
 */
export const OnlyPreviews: Story = {
  args: {
    jobs: [
      {
        id: '1',
        job_type: 'preview',
        script_name: 'Script A Preview',
        status: 'completed',
        total_rows_processed: 100,
        started_at: oneHourAgo.toISOString(),
        duration: 15,
      },
      {
        id: '2',
        job_type: 'preview',
        script_name: 'Script B Preview',
        status: 'completed',
        total_rows_processed: 250,
        started_at: twoHoursAgo.toISOString(),
        duration: 22,
      },
      {
        id: '3',
        job_type: 'preview',
        script_name: 'Script C Preview',
        status: 'completed',
        total_rows_processed: 500,
        started_at: yesterday.toISOString(),
        duration: 45,
      },
    ],
    onViewAll: () => console.log('View all clicked'),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};

/**
 * Long script names
 */
export const LongNames: Story = {
  args: {
    jobs: [
      {
        id: '1',
        job_type: 'single_script',
        script_name: 'Very Long Script Name That Should Be Truncated In The UI',
        status: 'completed',
        total_rows_processed: 1000,
        litigator_count: 50,
        dnc_count: 30,
        clean_count: 920,
        started_at: oneHourAgo.toISOString(),
        duration: 300,
      },
      {
        id: '2',
        job_type: 'preview',
        script_name: 'Another Extremely Long Script Name For Testing Purposes',
        status: 'completed',
        total_rows_processed: 100,
        started_at: twoHoursAgo.toISOString(),
        duration: 20,
      },
    ],
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};

/**
 * In context - sidebar placement
 */
export const InContext: Story = {
  decorators: [
    (Story) => (
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          p: 3,
          backgroundColor: '#f8f9fa',
          minHeight: 500,
        }}
      >
        <Box
          sx={{
            flex: 1,
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
            Main content area (ETL controls, etc.)
          </Box>
        </Box>
        <Box sx={{ width: 360 }}>
          <Story />
        </Box>
      </Box>
    ),
  ],
  args: {
    jobs: sampleJobs,
    maxItems: 6,
    onViewAll: () => console.log('View all clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
  },
};
