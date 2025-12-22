/**
 * ResultsV2 Page Stories
 * Storybook stories for the compact Results page
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { CompactJobsList } from '../components/features/results/CompactJobsList';
import { ResultsDataTable } from '../components/features/results/ResultsDataTable';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { textColors } from '../theme';

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
];

const mockRecords = Array.from({ length: 20 }, (_, i) => ({
  record_id: `record-${i + 1}`,
  first_name: ['John', 'Jane', 'Michael', 'Sarah', 'David'][i % 5],
  last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5],
  address: `${100 + i * 10} Main Street`,
  city: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Phoenix'][i % 5],
  state: ['CA', 'TX', 'FL', 'NY', 'AZ'][i % 5],
  zip_code: `${90000 + i * 100}`,
  phone_1: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 11).padStart(4, '0')}`,
  email_1: `${['john', 'jane', 'michael', 'sarah', 'david'][i % 5]}${i + 1}@example.com`,
  in_litigator_list: i % 7 === 0 ? 'Yes' : 'No',
  processed_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
}));

// Layout wrapper to simulate full page
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ height: 600, p: 3, backgroundColor: '#f8f9fa' }}>
    <Typography
      variant="h5"
      sx={{
        fontWeight: 600,
        color: textColors.primary,
        mb: 3,
      }}
    >
      Results
    </Typography>
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        height: 'calc(100% - 48px)',
      }}
    >
      {children}
    </Box>
  </Box>
);

// Component for stories - simulates the page layout
const ResultsV2Layout = ({
  jobs,
  selectedJobId,
  jobsLoading,
  records,
  total,
  litigatorCount,
  excludeLitigators,
  currentPage,
  recordsPerPage,
  resultsLoading,
  isExporting,
}: {
  jobs: typeof mockJobs;
  selectedJobId: string | null;
  jobsLoading: boolean;
  records: typeof mockRecords;
  total: number;
  litigatorCount?: number;
  excludeLitigators: boolean;
  currentPage: number;
  recordsPerPage: number;
  resultsLoading: boolean;
  isExporting: boolean;
}) => {
  const selectedJob = jobs.find((j) => j.job_id === selectedJobId);

  return (
    <PageWrapper>
      {/* Left Panel - Jobs List */}
      <Box sx={{ width: 300, flexShrink: 0 }}>
        <CompactJobsList
          jobs={jobs}
          selectedJobId={selectedJobId}
          isLoading={jobsLoading}
          onSelectJob={(job) => console.log('Selected:', job.job_name)}
        />
      </Box>

      {/* Right Panel - Results Table */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedJob ? (
          <ResultsDataTable
            jobName={selectedJob.job_name}
            records={records}
            total={total}
            litigatorCount={litigatorCount}
            excludeLitigators={excludeLitigators}
            currentPage={currentPage}
            recordsPerPage={recordsPerPage}
            isLoading={resultsLoading}
            isExporting={isExporting}
            onToggleExclude={(v) => console.log('Toggle exclude:', v)}
            onPageChange={(p) => console.log('Page:', p)}
            onRecordsPerPageChange={(pp) => console.log('Per page:', pp)}
            onExport={() => console.log('Export clicked')}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: 'grey.300',
              borderRadius: 2,
              backgroundColor: 'grey.50',
            }}
          >
            <EmptyState
              icon={<TableChart sx={{ fontSize: 64 }} />}
              title="Select a Job"
              description="Choose a job from the list to view its results"
              size="lg"
            />
          </Box>
        )}
      </Box>
    </PageWrapper>
  );
};

const meta: Meta<typeof ResultsV2Layout> = {
  title: 'Pages/ResultsV2',
  component: ResultsV2Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ResultsV2Layout>;

// No job selected - initial state
export const NoJobSelected: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: null,
    jobsLoading: false,
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// Job selected with results
export const JobSelected: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: mockRecords,
    total: 15420,
    litigatorCount: 342,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// Loading jobs
export const LoadingJobs: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    jobsLoading: true,
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// Loading results
export const LoadingResults: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: true,
    isExporting: false,
  },
};

// Empty results
export const EmptyResults: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// Exporting
export const Exporting: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: mockRecords,
    total: 15420,
    litigatorCount: 342,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: true,
  },
};

// With litigators excluded
export const LitigatorsExcluded: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: mockRecords.filter((r) => r.in_litigator_list === 'No'),
    total: 15078,
    litigatorCount: 342,
    excludeLitigators: true,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// Page 2
export const SecondPage: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: 'abc123-def456-ghi789',
    jobsLoading: false,
    records: mockRecords,
    total: 15420,
    litigatorCount: 342,
    excludeLitigators: false,
    currentPage: 2,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};

// No jobs at all
export const NoJobs: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    jobsLoading: false,
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 100,
    resultsLoading: false,
    isExporting: false,
  },
};
