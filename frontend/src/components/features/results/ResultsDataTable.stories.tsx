import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import { ResultsDataTable } from './ResultsDataTable';
import type { ResultRecord } from './ResultsDataTable';

// ============================================
// MOCK DATA
// ============================================

/**
 * Generate a single mock result record
 */
function createMockRecord(
  index: number,
  overrides?: Partial<ResultRecord>
): ResultRecord {
  const firstNames = ['John', 'Jane', 'Robert', 'Maria', 'Michael', 'Sarah', 'David', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA'];
  const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Philadelphia', 'Chicago', 'Cleveland', 'Atlanta'];

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const state = states[index % states.length];
  const city = cities[index % cities.length];
  const isLitigator = index % 5 === 0;

  return {
    record_id: `rec-${String(index).padStart(6, '0')}`,
    first_name: firstName,
    last_name: lastName,
    address: `${100 + index} Main Street`,
    city: city,
    state: state,
    zip_code: String(10000 + (index % 90000)).padStart(5, '0'),
    phone_1: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email_1: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    in_litigator_list: isLitigator ? 'Yes' : 'No',
    processed_at: new Date(Date.now() - index * 60000).toISOString(),
    ...overrides,
  };
}

/**
 * Small dataset (5-10 records)
 */
const smallDataset: ResultRecord[] = Array.from({ length: 8 }, (_, i) => createMockRecord(i));

/**
 * Medium dataset with litigators (50 records)
 */
const mediumDataset: ResultRecord[] = Array.from({ length: 50 }, (_, i) =>
  createMockRecord(i, { in_litigator_list: i % 7 === 0 ? 'Yes' : 'No' })
);

/**
 * Large dataset for pagination testing (150 records)
 */
const largeDataset: ResultRecord[] = Array.from({ length: 150 }, (_, i) => createMockRecord(i));

/**
 * Dataset with all litigators flagged
 */
const allLitigatorsDataset: ResultRecord[] = Array.from({ length: 10 }, (_, i) =>
  createMockRecord(i, { in_litigator_list: 'Yes' })
);

/**
 * Dataset with missing phone/email
 */
const incompleteLDataset: ResultRecord[] = [
  createMockRecord(0, { phone_1: undefined, email_1: undefined }),
  createMockRecord(1, { phone_1: undefined }),
  createMockRecord(2, { email_1: undefined }),
  createMockRecord(3),
  createMockRecord(4, { phone_1: undefined, email_1: undefined }),
];

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof ResultsDataTable> = {
  title: 'Features/Results/ResultsDataTable',
  component: ResultsDataTable,
  tags: ['autodocs'],
  argTypes: {
    jobName: {
      control: 'text',
      description: 'Name of the ETL job',
    },
    records: {
      description: 'Array of result records to display',
      table: {
        type: { summary: 'ResultRecord[]' },
      },
    },
    total: {
      control: 'number',
      description: 'Total number of records (for pagination)',
    },
    litigatorCount: {
      control: 'number',
      description: 'Number of records flagged as litigators',
    },
    excludeLitigators: {
      control: 'boolean',
      description: 'Whether litigators are excluded from view',
    },
    currentPage: {
      control: 'number',
      description: 'Current page number (1-based)',
    },
    recordsPerPage: {
      control: { type: 'select', options: [50, 100, 200, 500] },
      description: 'Number of records to display per page',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state of the table',
    },
    isExporting: {
      control: 'boolean',
      description: 'Whether CSV export is in progress',
    },
    onToggleExclude: {
      description: 'Callback when exclude litigators toggle is changed',
      action: 'toggle-exclude',
    },
    onPageChange: {
      description: 'Callback when page is changed',
      action: 'page-change',
    },
    onRecordsPerPageChange: {
      description: 'Callback when records per page is changed',
      action: 'records-per-page-change',
    },
    onExport: {
      description: 'Callback when export button is clicked',
      action: 'export',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsDataTable>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default table with small dataset
 */
export const Default: Story = {
  args: {
    jobName: 'Daily CA Leads Export',
    records: smallDataset,
    total: smallDataset.length,
    litigatorCount: smallDataset.filter((r) => r.in_litigator_list === 'Yes').length,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => console.log('Import clicked'),
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
    },
    onPageChange: (page) => {
      console.log('Page changed to:', page);
    },
    onRecordsPerPageChange: (perPage) => {
      console.log('Records per page changed to:', perPage);
    },
    onExport: () => {
      console.log('Export CSV clicked');
      alert('Starting CSV export...');
    },
  },
};

/**
 * Empty state - no records found
 */
export const Empty: Story = {
  args: {
    jobName: 'Empty Job Results',
    records: [],
    total: 0,
    litigatorCount: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: () => {},
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {},
  },
};

/**
 * Loading state - fetching records
 */
export const Loading: Story = {
  args: {
    jobName: 'Loading Job Results',
    records: [],
    total: 0,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: true,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: () => {},
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {},
  },
};

/**
 * Large dataset with pagination (150 records)
 * Shows pagination controls with multiple pages
 */
export const WithPagination: Story = {
  args: {
    jobName: 'Large Dataset - Page 1 of 3',
    records: largeDataset.slice(0, 50),
    total: largeDataset.length,
    litigatorCount: largeDataset.filter((r) => r.in_litigator_list === 'Yes').length,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
    },
    onPageChange: (page) => {
      console.log('Page changed to:', page);
      alert(`Navigating to page ${page}`);
    },
    onRecordsPerPageChange: (perPage) => {
      console.log('Records per page changed to:', perPage);
    },
    onExport: () => {
      console.log('Export CSV clicked');
    },
  },
};

/**
 * Dataset with all records flagged as litigators
 */
export const AllLitigators: Story = {
  args: {
    jobName: 'High Risk - All Litigators',
    records: allLitigatorsDataset,
    total: allLitigatorsDataset.length,
    litigatorCount: allLitigatorsDataset.length,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
      alert(exclude ? 'Excluding all litigators - table will be empty!' : 'Showing all records');
    },
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {
      console.log('Export CSV clicked');
    },
  },
};

/**
 * Dataset with incomplete data (missing phones/emails)
 */
export const IncompleteData: Story = {
  args: {
    jobName: 'Incomplete Records',
    records: incompleteLDataset,
    total: incompleteLDataset.length,
    litigatorCount: 1,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: () => {},
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {
      console.log('Export CSV clicked');
    },
  },
};

/**
 * Exporting state - CSV export in progress
 */
export const Exporting: Story = {
  args: {
    jobName: 'Exporting Results',
    records: mediumDataset,
    total: mediumDataset.length,
    litigatorCount: mediumDataset.filter((r) => r.in_litigator_list === 'Yes').length,
    excludeLitigators: false,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: true,
    onToggleExclude: () => {},
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {},
  },
};

/**
 * Table with exclude litigators enabled
 */
export const ExcludingLitigators: Story = {
  args: {
    jobName: 'Clean Records Only',
    records: mediumDataset.filter((r) => r.in_litigator_list === 'No'),
    total: mediumDataset.filter((r) => r.in_litigator_list === 'No').length,
    litigatorCount: mediumDataset.filter((r) => r.in_litigator_list === 'Yes').length,
    excludeLitigators: true,
    currentPage: 1,
    recordsPerPage: 50,
    isLoading: false,
    isExporting: false,
    onImport: () => {},
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
      alert(exclude ? 'Excluding litigators' : 'Showing all records');
    },
    onPageChange: () => {},
    onRecordsPerPageChange: () => {},
    onExport: () => {
      console.log('Export CSV clicked');
    },
  },
};

/**
 * Component as it appears in Results Page context
 */
export const InResultsPageContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          ETL Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and export processed records from your ETL jobs
        </Typography>
      </Box>

      <ResultsDataTable
        jobName="Weekly FL Export - 2025-12-15"
        records={mediumDataset.slice(0, 50)}
        total={mediumDataset.length}
        litigatorCount={mediumDataset.filter((r) => r.in_litigator_list === 'Yes').length}
        excludeLitigators={false}
        currentPage={1}
        recordsPerPage={50}
        isLoading={false}
        isExporting={false}
        onImport={() => {}}
        onToggleExclude={(exclude) => {
          console.log('Toggle exclude litigators:', exclude);
        }}
        onPageChange={(page) => {
          console.log('Page changed to:', page);
        }}
        onRecordsPerPageChange={(perPage) => {
          console.log('Records per page changed to:', perPage);
        }}
        onExport={() => {
          console.log('Export CSV clicked');
          alert('Starting CSV export...');
        }}
      />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Virtualization:</strong> Table uses TanStack Virtual for optimal performance with large datasets
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Pagination:</strong> Configurable records per page (50, 100, 200, 500)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Export:</strong> CSV export includes all columns with UTF-8 encoding for Excel compatibility
        </Typography>
      </Box>
    </Box>
  ),
};
