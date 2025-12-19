import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Grid } from '@mui/material';
import { JobsListCard } from './JobsListCard';
import type { JobItem } from './JobsListCard';
import { palette } from '../../../theme';

// ============================================
// MOCK DATA
// ============================================

/**
 * Mock job with typical record and litigator counts
 */
const jobWithResults: JobItem = {
  job_id: 'job-abc123def456',
  job_name: 'Daily CA Leads - December',
  record_count: 5000,
  litigator_count: 234,
  last_processed: '2025-12-15T14:30:00Z',
};

/**
 * Mock job with high litigator count
 */
const highLitigatorJob: JobItem = {
  job_id: 'job-def456ghi789',
  job_name: 'High Priority TX Leads',
  record_count: 3500,
  litigator_count: 892,
  last_processed: '2025-12-14T10:15:00Z',
};

/**
 * Mock job with minimal litigators
 */
const cleanJob: JobItem = {
  job_id: 'job-ghi789jkl012',
  job_name: 'Clean FL Leads Export',
  record_count: 8000,
  litigator_count: 12,
  last_processed: '2025-12-13T08:45:00Z',
};

/**
 * Mock job with very large record count
 */
const largeJob: JobItem = {
  job_id: 'job-jkl012mno345',
  job_name: 'Monthly National Run',
  record_count: 125000,
  litigator_count: 3456,
  last_processed: '2025-12-12T16:20:00Z',
};

/**
 * Mock job with recent timestamp
 */
const recentJob: JobItem = {
  job_id: 'job-mno345pqr678',
  job_name: 'Combined States - Quick Run',
  record_count: 1500,
  litigator_count: 67,
  last_processed: '2025-12-16T12:00:00Z',
};

/**
 * Mock job with older timestamp
 */
const olderJob: JobItem = {
  job_id: 'job-pqr678stu901',
  job_name: 'Weekly CA Export',
  record_count: 4200,
  litigator_count: 189,
  last_processed: '2025-12-10T14:30:00Z',
};

/**
 * Mock job with zero litigators
 */
const zeroLitigatorsJob: JobItem = {
  job_id: 'job-stu901vwx234',
  job_name: 'Verified Clean List',
  record_count: 2500,
  litigator_count: 0,
  last_processed: '2025-12-11T09:00:00Z',
};

/**
 * Small dataset job
 */
const smallJob: JobItem = {
  job_id: 'job-vwx234yza567',
  job_name: 'Test Preview Dataset',
  record_count: 50,
  litigator_count: 2,
  last_processed: '2025-12-16T11:30:00Z',
};

/**
 * Mixed jobs array for default stories (5-10 jobs)
 */
const mixedJobs: JobItem[] = [
  recentJob,
  jobWithResults,
  highLitigatorJob,
  cleanJob,
  olderJob,
  largeJob,
  zeroLitigatorsJob,
];

/**
 * Pagination test data (12+ jobs to test scrolling)
 */
const manyJobs: JobItem[] = [
  recentJob,
  jobWithResults,
  highLitigatorJob,
  cleanJob,
  olderJob,
  largeJob,
  zeroLitigatorsJob,
  smallJob,
  {
    job_id: 'job-bcd890efg123',
    job_name: 'Arizona Leads - Week 48',
    record_count: 3200,
    litigator_count: 145,
    last_processed: '2025-12-09T13:45:00Z',
  },
  {
    job_id: 'job-efg123hij456',
    job_name: 'Nevada High Priority',
    record_count: 2800,
    litigator_count: 98,
    last_processed: '2025-12-08T10:20:00Z',
  },
  {
    job_id: 'job-hij456klm789',
    job_name: 'Combined Multi-State',
    record_count: 15000,
    litigator_count: 1234,
    last_processed: '2025-12-07T16:00:00Z',
  },
  {
    job_id: 'job-klm789nop012',
    job_name: 'Oregon Quick Export',
    record_count: 1200,
    litigator_count: 34,
    last_processed: '2025-12-06T09:15:00Z',
  },
  {
    job_id: 'job-nop012qrs345',
    job_name: 'Washington Leads',
    record_count: 5500,
    litigator_count: 267,
    last_processed: '2025-12-05T14:30:00Z',
  },
];

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof JobsListCard> = {
  title: 'Features/Results/JobsListCard',
  component: JobsListCard,
  tags: ['autodocs'],
  argTypes: {
    jobs: {
      description: 'Array of job items to display',
      table: {
        type: { summary: 'JobItem[]' },
      },
    },
    selectedJobId: {
      control: 'text',
      description: 'ID of currently selected job (highlighted)',
    },
    totalJobs: {
      control: 'number',
      description: 'Total count of jobs (shown in card title)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    onSelectJob: {
      description: 'Callback when job is clicked',
      action: 'job-selected',
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobsListCard>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default state with mixed jobs
 */
export const Default: Story = {
  args: {
    jobs: mixedJobs,
    selectedJobId: mixedJobs[1].job_id,
    totalJobs: mixedJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * Empty state - no jobs found
 */
export const Empty: Story = {
  args: {
    jobs: [],
    selectedJobId: '',
    totalJobs: 0,
    isLoading: false,
    onSelectJob: () => {},
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    jobs: [],
    selectedJobId: '',
    totalJobs: 0,
    isLoading: true,
    onSelectJob: () => {},
  },
};

/**
 * Single job selected
 */
export const SingleJobSelected: Story = {
  args: {
    jobs: [jobWithResults],
    selectedJobId: jobWithResults.job_id,
    totalJobs: 1,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
      alert(`Selected: ${job.job_name}`);
    },
  },
};

/**
 * No selection - all jobs unselected
 */
export const NoSelection: Story = {
  args: {
    jobs: mixedJobs,
    selectedJobId: '',
    totalJobs: mixedJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * First job selected (top of list)
 */
export const FirstJobSelected: Story = {
  args: {
    jobs: mixedJobs,
    selectedJobId: mixedJobs[0].job_id,
    totalJobs: mixedJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * Last job selected (bottom of list)
 */
export const LastJobSelected: Story = {
  args: {
    jobs: mixedJobs,
    selectedJobId: mixedJobs[mixedJobs.length - 1].job_id,
    totalJobs: mixedJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * Many jobs with scrolling (12+ jobs)
 */
export const WithScrolling: Story = {
  args: {
    jobs: manyJobs,
    selectedJobId: manyJobs[5].job_id,
    totalJobs: manyJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * High litigator counts
 */
export const HighLitigatorCounts: Story = {
  args: {
    jobs: [highLitigatorJob, largeJob, jobWithResults],
    selectedJobId: highLitigatorJob.job_id,
    totalJobs: 3,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * Clean jobs (low litigator counts)
 */
export const CleanJobs: Story = {
  args: {
    jobs: [cleanJob, zeroLitigatorsJob, smallJob],
    selectedJobId: cleanJob.job_id,
    totalJobs: 3,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
    },
  },
};

/**
 * Interactive - Click to select jobs
 */
export const Interactive: Story = {
  args: {
    jobs: mixedJobs,
    selectedJobId: mixedJobs[0].job_id,
    totalJobs: mixedJobs.length,
    isLoading: false,
    onSelectJob: (job) => {
      console.log('Job selected:', job);
      alert(
        `Selected: ${job.job_name}\n` +
        `Records: ${job.record_count.toLocaleString()}\n` +
        `Litigators: ${job.litigator_count.toLocaleString()}`
      );
    },
  },
};

/**
 * Component in results page context
 */
export const InResultsPageContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          ETL Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze results from completed ETL jobs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} md={4}>
          <JobsListCard
            jobs={mixedJobs}
            selectedJobId={mixedJobs[1].job_id}
            totalJobs={mixedJobs.length}
            isLoading={false}
            onSelectJob={(job) => {
              console.log('Job selected:', job);
              alert(`Viewing results for: ${job.job_name}`);
            }}
          />
        </Grid>

        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              p: 4,
              border: `1px dashed ${palette.gray[300]}`,
              borderRadius: 2,
              textAlign: 'center',
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Results details panel would appear here when a job is selected
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Selection:</strong> Click any job to view its results
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Visual Feedback:</strong> Selected job highlighted with accent color border
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Scrolling:</strong> List scrolls when more than 7-8 jobs
        </Typography>
      </Box>
    </Box>
  ),
};
