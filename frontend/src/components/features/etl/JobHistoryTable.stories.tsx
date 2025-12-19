import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';
import { JobHistoryTable } from './JobHistoryTable';
import type { JobHistoryItem, Script } from './JobHistoryTable';
import { History } from '@mui/icons-material';
import { palette } from '../../../theme';

// ============================================
// MOCK DATA
// ============================================

/**
 * Mock scripts for testing
 */
const mockScripts: Script[] = [
  { id: 'script-1', name: 'Daily CA Leads' },
  { id: 'script-2', name: 'High Priority TX' },
  { id: 'script-3', name: 'Combined States' },
  { id: 'script-4', name: 'Weekly FL Export' },
  { id: 'script-5', name: 'Monthly National Run' },
];

/**
 * Completed ETL job with full compliance stats
 */
const completedETLJob: JobHistoryItem = {
  id: 'job-abc123',
  job_type: 'single_script',
  script_id: 'script-1',
  status: 'completed',
  row_limit: 5000,
  total_rows_processed: 5000,
  litigator_count: 234,
  dnc_count: 156,
  both_count: 45,
  clean_count: 4565,
  started_at: '2025-12-15T14:30:00Z',
  created_at: '2025-12-15T14:25:00Z',
};

/**
 * Running ETL job (in progress)
 */
const runningJob: JobHistoryItem = {
  id: 'job-def456',
  job_type: 'combined_scripts',
  script_id: 'script-3',
  status: 'running',
  row_limit: 10000,
  total_rows_processed: 4500,
  started_at: '2025-12-16T10:00:00Z',
  created_at: '2025-12-16T09:55:00Z',
};

/**
 * Failed ETL job
 */
const failedJob: JobHistoryItem = {
  id: 'job-ghi789',
  job_type: 'single_script',
  script_id: 'script-2',
  status: 'failed',
  row_limit: 3000,
  total_rows_processed: 1250,
  started_at: '2025-12-14T16:20:00Z',
  created_at: '2025-12-14T16:15:00Z',
};

/**
 * Cancelled ETL job
 */
const cancelledJob: JobHistoryItem = {
  id: 'job-jkl012',
  job_type: 'single_script',
  script_id: 'script-4',
  status: 'cancelled',
  row_limit: 2000,
  total_rows_processed: 800,
  started_at: '2025-12-13T11:00:00Z',
  created_at: '2025-12-13T10:55:00Z',
};

/**
 * Completed preview job (50 row limit)
 */
const completedPreview: JobHistoryItem = {
  id: 'preview-abc123',
  job_type: 'preview',
  script_id: 'script-1',
  status: 'completed',
  row_limit: 50,
  total_rows_processed: 50,
  started_at: '2025-12-16T08:00:00Z',
  created_at: '2025-12-16T07:58:00Z',
};

/**
 * Running preview job
 */
const runningPreview: JobHistoryItem = {
  id: 'preview-def456',
  job_type: 'preview',
  script_id: 'script-2',
  status: 'running',
  row_limit: 50,
  total_rows_processed: 25,
  started_at: '2025-12-16T09:30:00Z',
  created_at: '2025-12-16T09:29:00Z',
};

/**
 * Another completed ETL job for variety
 */
const completedETLJob2: JobHistoryItem = {
  id: 'job-mno345',
  job_type: 'combined_scripts',
  script_id: 'script-5',
  status: 'completed',
  row_limit: 8000,
  total_rows_processed: 8000,
  litigator_count: 512,
  dnc_count: 289,
  both_count: 78,
  clean_count: 7121,
  started_at: '2025-12-14T09:15:00Z',
  created_at: '2025-12-14T09:10:00Z',
};

/**
 * Mixed jobs array for default stories (5-7 jobs)
 */
const mixedJobs: JobHistoryItem[] = [
  completedETLJob,
  runningJob,
  failedJob,
  completedPreview,
  runningPreview,
  completedETLJob2,
  cancelledJob,
];

/**
 * Pagination test data (12+ jobs to trigger pagination controls)
 */
const paginationJobs: JobHistoryItem[] = [
  completedETLJob,
  runningJob,
  failedJob,
  cancelledJob,
  completedPreview,
  runningPreview,
  completedETLJob2,
  {
    id: 'job-pqr678',
    job_type: 'single_script',
    script_id: 'script-3',
    status: 'completed',
    row_limit: 4000,
    total_rows_processed: 4000,
    litigator_count: 198,
    dnc_count: 134,
    both_count: 32,
    clean_count: 3636,
    started_at: '2025-12-13T15:45:00Z',
    created_at: '2025-12-13T15:40:00Z',
  },
  {
    id: 'job-stu901',
    job_type: 'single_script',
    script_id: 'script-1',
    status: 'completed',
    row_limit: 6000,
    total_rows_processed: 6000,
    litigator_count: 321,
    dnc_count: 211,
    both_count: 56,
    clean_count: 5412,
    started_at: '2025-12-12T11:20:00Z',
    created_at: '2025-12-12T11:15:00Z',
  },
  {
    id: 'job-vwx234',
    job_type: 'single_script',
    script_id: 'script-4',
    status: 'running',
    row_limit: 7500,
    total_rows_processed: 3200,
    started_at: '2025-12-16T14:00:00Z',
    created_at: '2025-12-16T13:55:00Z',
  },
  {
    id: 'preview-ghi789',
    job_type: 'preview',
    script_id: 'script-3',
    status: 'completed',
    row_limit: 50,
    total_rows_processed: 50,
    started_at: '2025-12-11T16:30:00Z',
    created_at: '2025-12-11T16:28:00Z',
  },
  {
    id: 'job-yza567',
    job_type: 'combined_scripts',
    script_id: 'script-5',
    status: 'failed',
    row_limit: 5000,
    total_rows_processed: 2100,
    started_at: '2025-12-10T10:00:00Z',
    created_at: '2025-12-10T09:55:00Z',
  },
  {
    id: 'job-bcd890',
    job_type: 'single_script',
    script_id: 'script-2',
    status: 'completed',
    row_limit: 3500,
    total_rows_processed: 3500,
    litigator_count: 167,
    dnc_count: 98,
    both_count: 28,
    clean_count: 3207,
    started_at: '2025-12-09T08:45:00Z',
    created_at: '2025-12-09T08:40:00Z',
  },
];

/**
 * Only completed ETL jobs (for showing View Results button)
 */
const onlyCompletedETL: JobHistoryItem[] = [
  completedETLJob,
  completedETLJob2,
  {
    id: 'job-efg123',
    job_type: 'single_script',
    script_id: 'script-2',
    status: 'completed',
    row_limit: 4500,
    total_rows_processed: 4500,
    litigator_count: 221,
    dnc_count: 178,
    both_count: 43,
    clean_count: 4058,
    started_at: '2025-12-11T13:30:00Z',
    created_at: '2025-12-11T13:25:00Z',
  },
];

/**
 * Only preview jobs
 */
const onlyPreviews: JobHistoryItem[] = [
  completedPreview,
  runningPreview,
  {
    id: 'preview-jkl012',
    job_type: 'preview',
    script_id: 'script-4',
    status: 'completed',
    row_limit: 50,
    total_rows_processed: 50,
    started_at: '2025-12-10T14:15:00Z',
    created_at: '2025-12-10T14:13:00Z',
  },
  {
    id: 'preview-mno345',
    job_type: 'preview',
    script_id: 'script-5',
    status: 'completed',
    row_limit: 50,
    total_rows_processed: 50,
    started_at: '2025-12-09T11:00:00Z',
    created_at: '2025-12-09T10:58:00Z',
  },
];

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof JobHistoryTable> = {
  title: 'Features/ETL/JobHistoryTable',
  component: JobHistoryTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    jobs: {
      description: 'Array of job history items to display',
      table: {
        type: { summary: 'JobHistoryItem[]' },
      },
    },
    scripts: {
      description: 'Available scripts for name lookup',
      table: {
        type: { summary: 'Script[]' },
      },
    },
    message: {
      control: 'text',
      description: 'Optional informational message displayed at top of table',
    },
    onViewPreview: {
      description: 'Callback when View button clicked for preview jobs',
      action: 'view-preview',
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobHistoryTable>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default table with mixed job types and statuses
 */
export const Default: Story = {
  args: {
    jobs: mixedJobs,
    scripts: mockScripts,
    onViewPreview: (job) => {
      console.log('View preview clicked:', job);
      alert(`Opening preview for job ${job.id}`);
    },
  },
};

/**
 * Empty state - no jobs to display
 */
export const Empty: Story = {
  args: {
    jobs: [],
    scripts: mockScripts,
    onViewPreview: () => {},
  },
};

/**
 * All status types in one view
 */
export const AllStatuses: Story = {
  args: {
    jobs: [
      completedETLJob,
      runningJob,
      failedJob,
      cancelledJob,
      completedPreview,
      runningPreview,
    ],
    scripts: mockScripts,
    onViewPreview: (job) => {
      console.log('View preview clicked:', job);
    },
  },
};

/**
 * Pagination demonstration with 12+ jobs
 * Shows pagination controls and page numbers
 */
export const WithPagination: Story = {
  args: {
    jobs: paginationJobs,
    scripts: mockScripts,
    onViewPreview: (job) => {
      console.log('View preview clicked:', job);
    },
  },
};

/**
 * Only preview jobs (shows "View" button instead of "View Results")
 */
export const OnlyPreviews: Story = {
  args: {
    jobs: onlyPreviews,
    scripts: mockScripts,
    onViewPreview: (job) => {
      console.log('View preview clicked:', job);
      alert(`Preview job ${job.id} - ${job.total_rows_processed} records`);
    },
  },
};

/**
 * Only completed ETL jobs (shows "View Results" button)
 * Demonstrates compliance stats (litigator, DNC, both, clean counts)
 */
export const OnlyCompletedETL: Story = {
  args: {
    jobs: onlyCompletedETL,
    scripts: mockScripts,
    onViewPreview: () => {},
  },
};

/**
 * Table with informational message
 */
export const WithMessage: Story = {
  args: {
    jobs: mixedJobs,
    scripts: mockScripts,
    message: 'Jobs are retained for 30 days. Older jobs are automatically archived.',
    onViewPreview: (job) => {
      console.log('View preview clicked:', job);
    },
  },
};

/**
 * Component as it appears in Dashboard context
 * Shows realistic page layout with heading and spacing
 */
export const InDashboardContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          ETL Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage your ETL jobs and preview requests
        </Typography>
      </Box>

      <JobHistoryTable
        jobs={paginationJobs}
        scripts={mockScripts}
        message="Real-time updates enabled. Jobs will refresh automatically when completed."
        onViewPreview={(job) => {
          console.log('View preview clicked:', job);
          alert(`Opening preview for job ${job.id}`);
        }}
      />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Navigation:</strong> Clicking "View Results" navigates to <code>/results?job_id={'{job.id}'}</code>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Pagination:</strong> Table shows 5 jobs per page with automatic pagination controls
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Preview Jobs:</strong> Show "View" button; ETL jobs show "View Results" button
        </Typography>
      </Box>
    </Box>
  ),
};
