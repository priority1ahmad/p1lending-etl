/**
 * ResultsPageV3 Stories
 * Full page stories showing the Airtable-inspired results layout
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { JobSidebar } from '../components/features/results/JobSidebar';
import { ResultsHeader } from '../components/features/results/ResultsHeader';
import { AirtableTable } from '../components/features/results/AirtableTable';
import { TableFooter } from '../components/features/results/TableFooter';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { textColors } from '../theme';

// Mock data
const mockJobs = [
  { job_id: '1', job_name: 'CA_Foreclosure_Q4_2024', record_count: 15420, last_processed: '2024-12-22T10:30:00Z' },
  { job_id: '2', job_name: 'TX_Refinance_Dec_2024', record_count: 8750, last_processed: '2024-12-21T15:45:00Z' },
  { job_id: '3', job_name: 'FL_Purchase_Winter_2024', record_count: 12300, last_processed: '2024-12-20T09:15:00Z' },
  { job_id: '4', job_name: 'NY_HELOC_Nov_2024', record_count: 5680, last_processed: '2024-12-19T14:00:00Z' },
  { job_id: '5', job_name: 'AZ_Investment_Props', record_count: 3200, last_processed: '2024-12-18T11:30:00Z' },
];

const generateRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    record_id: `record-${i + 1}`,
    first_name: ['John', 'Jane', 'Michael', 'Sarah', 'David'][i % 5],
    last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5],
    address: `${100 + i * 10} ${['Main', 'Oak', 'Pine'][i % 3]} Street`,
    city: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Phoenix'][i % 5],
    state: ['CA', 'TX', 'FL', 'NY', 'AZ'][i % 5],
    zip_code: `${90000 + i * 100}`,
    phone_1: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 11).slice(-4)}`,
    phone_2: i % 3 === 0 ? `(555) ${String(200 + i).padStart(3, '0')}-0000` : undefined,
    phone_3: undefined,
    email_1: `${['john', 'jane', 'michael', 'sarah', 'david'][i % 5]}${i + 1}@example.com`,
    email_2: i % 2 === 0 ? 'work@company.com' : undefined,
    email_3: undefined,
    in_litigator_list: i % 7 === 0 ? 'Yes' : 'No',
    processed_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
  }));

// Page layout component for stories
const ResultsPageLayout = ({
  jobs,
  selectedJobId,
  jobsLoading,
  sidebarCollapsed,
  records,
  total,
  litigatorCount,
  currentPage,
  excludeLitigators,
  resultsLoading,
  isExporting,
}: {
  jobs: typeof mockJobs;
  selectedJobId: string | null;
  jobsLoading: boolean;
  sidebarCollapsed: boolean;
  records: ReturnType<typeof generateRecords>;
  total: number;
  litigatorCount: number;
  currentPage: number;
  excludeLitigators: boolean;
  resultsLoading: boolean;
  isExporting: boolean;
}) => {
  const selectedJob = jobs.find((j) => j.job_id === selectedJobId);

  return (
    <Box sx={{ height: 700, display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
      {/* Page Title Bar */}
      <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: textColors.primary, fontSize: '1.25rem' }}>
          Results
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <JobSidebar
          jobs={jobs}
          selectedJobId={selectedJobId}
          isLoading={jobsLoading}
          isCollapsed={sidebarCollapsed}
          onSelectJob={(job) => console.log('Selected:', job.job_name)}
          onToggleCollapse={() => console.log('Toggle collapse')}
        />

        {/* Main Panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedJob ? (
            <>
              <ResultsHeader
                jobName={selectedJob.job_name}
                recordCount={total}
                litigatorCount={litigatorCount}
                processedDate={selectedJob.last_processed}
                isExporting={isExporting}
                onExport={() => console.log('Export')}
              />
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <AirtableTable records={records} isLoading={resultsLoading} />
              </Box>
              <TableFooter
                total={total}
                currentPage={currentPage}
                recordsPerPage={100}
                excludeLitigators={excludeLitigators}
                onPageChange={(p) => console.log('Page:', p)}
                onToggleExclude={(e) => console.log('Exclude:', e)}
              />
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
              <EmptyState
                icon={<TableChart sx={{ fontSize: 72, color: '#d1d5db' }} />}
                title="Select a Job"
                description="Choose a job from the sidebar to view its results"
                size="lg"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const meta: Meta<typeof ResultsPageLayout> = {
  title: 'Pages/ResultsPageV3',
  component: ResultsPageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ResultsPageLayout>;

export const NoJobSelected: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: null,
    jobsLoading: false,
    sidebarCollapsed: false,
    records: [],
    total: 0,
    litigatorCount: 0,
    currentPage: 1,
    excludeLitigators: false,
    resultsLoading: false,
    isExporting: false,
  },
};

export const JobSelected: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: '1',
    jobsLoading: false,
    sidebarCollapsed: false,
    records: [{
      "record_id": "record-1",
      "first_name": "John",
      "last_name": "Smith",
      "address": "100 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90000",
      "phone_1": "(555) 100-1000",
      "phone_2": "(555) 200-0000",
      "email_1": "john1@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-22T19:46:41.307Z"
    }, {
      "record_id": "record-2",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "110 Oak Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "90100",
      "phone_1": "(555) 101-1011",
      "email_1": "jane2@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T18:46:41.307Z"
    }, {
      "record_id": "record-3",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "120 Pine Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "90200",
      "phone_1": "(555) 102-1022",
      "email_1": "michael3@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T17:46:41.307Z"
    }, {
      "record_id": "record-4",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "130 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "90300",
      "phone_1": "(555) 103-1033",
      "phone_2": "(555) 203-0000",
      "email_1": "sarah4@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T16:46:41.307Z"
    }, {
      "record_id": "record-5",
      "first_name": "David",
      "last_name": "Jones",
      "address": "140 Oak Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "90400",
      "phone_1": "(555) 104-1044",
      "email_1": "david5@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T15:46:41.307Z"
    }, {
      "record_id": "record-6",
      "first_name": "John",
      "last_name": "Smith",
      "address": "150 Pine Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90500",
      "phone_1": "(555) 105-1055",
      "email_1": "john6@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T14:46:41.307Z"
    }, {
      "record_id": "record-7",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "160 Main Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "90600",
      "phone_1": "(555) 106-1066",
      "phone_2": "(555) 206-0000",
      "email_1": "jane7@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T13:46:41.307Z"
    }, {
      "record_id": "record-8",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "170 Oak Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "90700",
      "phone_1": "(555) 107-1077",
      "email_1": "michael8@example.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-22T12:46:41.307Z"
    }, {
      "record_id": "record-9",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "180 Pine Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "90800",
      "phone_1": "(555) 108-1088",
      "email_1": "sarah9@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T11:46:41.307Z"
    }, {
      "record_id": "record-10",
      "first_name": "David",
      "last_name": "Jones",
      "address": "190 Main Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "90900",
      "phone_1": "(555) 109-1099",
      "phone_2": "(555) 209-0000",
      "email_1": "david10@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T10:46:41.307Z"
    }, {
      "record_id": "record-11",
      "first_name": "John",
      "last_name": "Smith",
      "address": "200 Oak Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "91000",
      "phone_1": "(555) 110-1110",
      "email_1": "john11@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T09:46:41.307Z"
    }, {
      "record_id": "record-12",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "210 Pine Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "91100",
      "phone_1": "(555) 111-1121",
      "email_1": "jane12@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T08:46:41.307Z"
    }, {
      "record_id": "record-13",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "220 Main Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "91200",
      "phone_1": "(555) 112-1132",
      "phone_2": "(555) 212-0000",
      "email_1": "michael13@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T07:46:41.307Z"
    }, {
      "record_id": "record-14",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "230 Oak Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "91300",
      "phone_1": "(555) 113-1143",
      "email_1": "sarah14@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T06:46:41.307Z"
    }, {
      "record_id": "record-15",
      "first_name": "David",
      "last_name": "Jones",
      "address": "240 Pine Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "91400",
      "phone_1": "(555) 114-1154",
      "email_1": "david15@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-22T05:46:41.307Z"
    }, {
      "record_id": "record-16",
      "first_name": "John",
      "last_name": "Smith",
      "address": "250 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "91500",
      "phone_1": "(555) 115-1165",
      "phone_2": "(555) 215-0000",
      "email_1": "john16@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T04:46:41.307Z"
    }, {
      "record_id": "record-17",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "260 Oak Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "91600",
      "phone_1": "(555) 116-1176",
      "email_1": "jane17@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T03:46:41.307Z"
    }, {
      "record_id": "record-18",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "270 Pine Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "91700",
      "phone_1": "(555) 117-1187",
      "email_1": "michael18@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T02:46:41.307Z"
    }, {
      "record_id": "record-19",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "280 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "91800",
      "phone_1": "(555) 118-1198",
      "phone_2": "(555) 218-0000",
      "email_1": "sarah19@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T01:46:41.307Z"
    }, {
      "record_id": "record-20",
      "first_name": "David",
      "last_name": "Jones",
      "address": "290 Oak Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "91900",
      "phone_1": "(555) 119-1209",
      "email_1": "david20@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-22T00:46:41.307Z"
    }, {
      "record_id": "record-21",
      "first_name": "John",
      "last_name": "Smith",
      "address": "300 Pine Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "92000",
      "phone_1": "(555) 120-1220",
      "email_1": "john21@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T23:46:41.307Z"
    }, {
      "record_id": "record-22",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "310 Main Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "92100",
      "phone_1": "(555) 121-1231",
      "phone_2": "(555) 221-0000",
      "email_1": "jane22@example.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-21T22:46:41.307Z"
    }, {
      "record_id": "record-23",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "320 Oak Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "92200",
      "phone_1": "(555) 122-1242",
      "email_1": "michael23@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T21:46:41.307Z"
    }, {
      "record_id": "record-24",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "330 Pine Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "92300",
      "phone_1": "(555) 123-1253",
      "email_1": "sarah24@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T20:46:41.307Z"
    }, {
      "record_id": "record-25",
      "first_name": "David",
      "last_name": "Jones",
      "address": "340 Main Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "92400",
      "phone_1": "(555) 124-1264",
      "phone_2": "(555) 224-0000",
      "email_1": "david25@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T19:46:41.307Z"
    }, {
      "record_id": "record-26",
      "first_name": "John",
      "last_name": "Smith",
      "address": "350 Oak Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "92500",
      "phone_1": "(555) 125-1275",
      "email_1": "john26@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T18:46:41.307Z"
    }, {
      "record_id": "record-27",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "360 Pine Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "92600",
      "phone_1": "(555) 126-1286",
      "email_1": "jane27@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T17:46:41.307Z"
    }, {
      "record_id": "record-28",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "370 Main Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "92700",
      "phone_1": "(555) 127-1297",
      "phone_2": "(555) 227-0000",
      "email_1": "michael28@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T16:46:41.307Z"
    }, {
      "record_id": "record-29",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "380 Oak Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "92800",
      "phone_1": "(555) 128-1308",
      "email_1": "sarah29@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-21T15:46:41.307Z"
    }, {
      "record_id": "record-30",
      "first_name": "David",
      "last_name": "Jones",
      "address": "390 Pine Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "92900",
      "phone_1": "(555) 129-1319",
      "email_1": "david30@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T14:46:41.307Z"
    }, {
      "record_id": "record-31",
      "first_name": "John",
      "last_name": "Smith",
      "address": "400 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "93000",
      "phone_1": "(555) 130-1330",
      "phone_2": "(555) 230-0000",
      "email_1": "john31@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T13:46:41.307Z"
    }, {
      "record_id": "record-32",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "410 Oak Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "93100",
      "phone_1": "(555) 131-1341",
      "email_1": "jane32@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T12:46:41.307Z"
    }, {
      "record_id": "record-33",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "420 Pine Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "93200",
      "phone_1": "(555) 132-1352",
      "email_1": "michael33@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T11:46:41.307Z"
    }, {
      "record_id": "record-34",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "430 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "93300",
      "phone_1": "(555) 133-1363",
      "phone_2": "(555) 233-0000",
      "email_1": "sarah34@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T10:46:41.307Z"
    }, {
      "record_id": "record-35",
      "first_name": "David",
      "last_name": "Jones",
      "address": "440 Oak Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "93400",
      "phone_1": "(555) 134-1374",
      "email_1": "david35@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T09:46:41.307Z"
    }, {
      "record_id": "record-36",
      "first_name": "John",
      "last_name": "Smith",
      "address": "450 Pine Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "93500",
      "phone_1": "(555) 135-1385",
      "email_1": "john36@example.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-21T08:46:41.307Z"
    }, {
      "record_id": "record-37",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "460 Main Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "93600",
      "phone_1": "(555) 136-1396",
      "phone_2": "(555) 236-0000",
      "email_1": "jane37@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T07:46:41.307Z"
    }, {
      "record_id": "record-38",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "470 Oak Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "93700",
      "phone_1": "(555) 137-1407",
      "email_1": "michael38@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T06:46:41.307Z"
    }, {
      "record_id": "record-39",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "480 Pine Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "93800",
      "phone_1": "(555) 138-1418",
      "email_1": "sarah39@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T05:46:41.307Z"
    }, {
      "record_id": "record-40",
      "first_name": "David",
      "last_name": "Jones",
      "address": "490 Main Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "93900",
      "phone_1": "(555) 139-1429",
      "phone_2": "(555) 239-0000",
      "email_1": "david40@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T04:46:41.307Z"
    }, {
      "record_id": "record-41",
      "first_name": "John",
      "last_name": "Smith",
      "address": "500 Oak Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "94000",
      "phone_1": "(555) 140-1440",
      "email_1": "john41@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T03:46:41.307Z"
    }, {
      "record_id": "record-42",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "510 Pine Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "94100",
      "phone_1": "(555) 141-1451",
      "email_1": "jane42@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T02:46:41.307Z"
    }, {
      "record_id": "record-43",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "520 Main Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "94200",
      "phone_1": "(555) 142-1462",
      "phone_2": "(555) 242-0000",
      "email_1": "michael43@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-21T01:46:41.307Z"
    }, {
      "record_id": "record-44",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "530 Oak Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "94300",
      "phone_1": "(555) 143-1473",
      "email_1": "sarah44@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-21T00:46:41.307Z"
    }, {
      "record_id": "record-45",
      "first_name": "David",
      "last_name": "Jones",
      "address": "540 Pine Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "94400",
      "phone_1": "(555) 144-1484",
      "email_1": "david45@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-20T23:46:41.307Z"
    }, {
      "record_id": "record-46",
      "first_name": "John",
      "last_name": "Smith",
      "address": "550 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "94500",
      "phone_1": "(555) 145-1495",
      "phone_2": "(555) 245-0000",
      "email_1": "john46@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-20T22:46:41.307Z"
    }, {
      "record_id": "record-47",
      "first_name": "Jane",
      "last_name": "Johnson",
      "address": "560 Oak Street",
      "city": "Houston",
      "state": "TX",
      "zip_code": "94600",
      "phone_1": "(555) 146-1506",
      "email_1": "jane47@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-20T21:46:41.307Z"
    }, {
      "record_id": "record-48",
      "first_name": "Michael",
      "last_name": "Williams",
      "address": "570 Pine Street",
      "city": "Miami",
      "state": "FL",
      "zip_code": "94700",
      "phone_1": "(555) 147-1517",
      "email_1": "michael48@example.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-20T20:46:41.307Z"
    }, {
      "record_id": "record-49",
      "first_name": "Sarah",
      "last_name": "Brown",
      "address": "580 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "94800",
      "phone_1": "(555) 148-1528",
      "phone_2": "(555) 248-0000",
      "email_1": "sarah49@example.com",
      "email_2": "work@company.com",
      "in_litigator_list": "No",
      "processed_at": "2025-12-20T19:46:41.307Z"
    }, {
      "record_id": "record-50",
      "first_name": "David",
      "last_name": "Jones",
      "address": "590 Oak Street",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "94900",
      "phone_1": "(555) 149-1539",
      "email_1": "david50@example.com",
      "in_litigator_list": "Yes",
      "processed_at": "2025-12-20T18:46:41.307Z"
    }],
    total: 15420,
    litigatorCount: 342,
    currentPage: 1,
    excludeLitigators: false,
    resultsLoading: false,
    isExporting: false,
  },
};

export const SidebarCollapsed: Story = {
  args: {
    ...JobSelected.args,
    sidebarCollapsed: true,
  },
};

export const LoadingJobs: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    jobsLoading: true,
    sidebarCollapsed: false,
    records: [],
    total: 0,
    litigatorCount: 0,
    currentPage: 1,
    excludeLitigators: false,
    resultsLoading: false,
    isExporting: false,
  },
};

export const LoadingResults: Story = {
  args: {
    jobs: mockJobs,
    selectedJobId: '1',
    jobsLoading: false,
    sidebarCollapsed: false,
    records: [],
    total: 0,
    litigatorCount: 0,
    currentPage: 1,
    excludeLitigators: false,
    resultsLoading: true,
    isExporting: false,
  },
};

export const Exporting: Story = {
  args: {
    ...JobSelected.args,
    isExporting: true,
  },
};

export const ExcludingLitigators: Story = {
  args: {
    ...JobSelected.args,
    records: generateRecords(50).filter((r) => r.in_litigator_list === 'No'),
    total: 15078,
    excludeLitigators: true,
  },
};

export const SecondPage: Story = {
  args: {
    ...JobSelected.args,
    currentPage: 2,
  },
};

export const NoJobs: Story = {
  args: {
    jobs: [],
    selectedJobId: null,
    jobsLoading: false,
    sidebarCollapsed: false,
    records: [],
    total: 0,
    litigatorCount: 0,
    currentPage: 1,
    excludeLitigators: false,
    resultsLoading: false,
    isExporting: false,
  },
};
