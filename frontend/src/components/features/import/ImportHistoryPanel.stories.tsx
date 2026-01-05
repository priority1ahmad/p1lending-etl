import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportHistoryPanel } from './ImportHistoryPanel';
import { Box } from '@mui/material';

import type { ImportRecord } from '../../../services/api/lodasoftImport';

const sampleImports: ImportRecord[] = [
  {
    import_id: '1',
    job_id: 'job-123',
    job_name: 'California Leads Q1 2024',
    status: 'completed',
    total_records: 1250,
    records_imported: 1248,
    records_failed: 2,
    progress: 100,
    started_at: '2024-01-15T10:30:00Z',
    completed_at: '2024-01-15T10:35:42Z',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    import_id: '2',
    job_id: 'job-123',
    job_name: 'California Leads Q1 2024',
    status: 'completed',
    total_records: 500,
    records_imported: 500,
    records_failed: 0,
    progress: 100,
    started_at: '2024-01-14T14:20:00Z',
    completed_at: '2024-01-14T14:22:15Z',
    created_at: '2024-01-14T14:20:00Z',
  },
  {
    import_id: '3',
    job_id: 'job-123',
    job_name: 'California Leads Q1 2024',
    status: 'failed',
    total_records: 800,
    records_imported: 245,
    records_failed: 0,
    progress: 30,
    started_at: '2024-01-13T09:00:00Z',
    completed_at: '2024-01-13T09:02:30Z',
    error_message: 'Connection timeout',
    created_at: '2024-01-13T09:00:00Z',
  },
  {
    import_id: '4',
    job_id: 'job-123',
    job_name: 'California Leads Q1 2024',
    status: 'in_progress',
    total_records: 1000,
    records_imported: 350,
    records_failed: 5,
    progress: 35,
    started_at: '2024-01-15T15:00:00Z',
    created_at: '2024-01-15T15:00:00Z',
  },
];

const meta: Meta<typeof ImportHistoryPanel> = {
  title: 'Features/Import/ImportHistoryPanel',
  component: ImportHistoryPanel,
  tags: ['autodocs'],
  argTypes: {
    onRefresh: { action: 'refresh-clicked' },
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 800, p: 2 }}>
        <Story />
      </Box>
    ),
  ],

};

export default meta;
type Story = StoryObj<typeof ImportHistoryPanel>;

export const Default: Story = {
  args: {
    imports: sampleImports,
    isLoading: false,
  },
};

export const Empty: Story = {
  args: {
    imports: [],
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    imports: [],
    isLoading: true,
  },
};

export const SingleImport: Story = {
  args: {
    imports: [sampleImports[0]],
    isLoading: false,
  },
};

export const WithFailures: Story = {
  args: {
    imports: [
      sampleImports[2],
      {
        import_id: '5',
        job_id: 'job-123',
        job_name: 'Test Job',
        status: 'failed',
        total_records: 200,
        records_imported: 0,
        records_failed: 0,
        progress: 0,
        started_at: '2024-01-12T08:00:00Z',
        completed_at: '2024-01-12T08:00:05Z',
        error_message: 'Authentication failed',
        created_at: '2024-01-12T08:00:00Z',
      },
    ],
    isLoading: false,
  },
};

export const InContext: Story = {
  render: (args) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ color: 'text.secondary', mb: 1 }}>Results Table would be here...</Box>
      </Box>
      <ImportHistoryPanel {...args} />
    </Box>
  ),
  args: {
    imports: sampleImports,
    isLoading: false,
  },
};
