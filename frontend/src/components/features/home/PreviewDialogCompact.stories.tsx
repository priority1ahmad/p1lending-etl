import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { PreviewDialogCompact, type PreviewStats } from './PreviewDialogCompact';

const meta: Meta<typeof PreviewDialogCompact> = {
  title: 'Features/Home/PreviewDialogCompact',
  component: PreviewDialogCompact,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof PreviewDialogCompact>;

const SAMPLE_ROWS = [
  { FIRST_NAME: 'John', LAST_NAME: 'Smith', CITY: 'Los Angeles', STATE: 'CA', PROPERTY_VALUE: 450000 },
  { FIRST_NAME: 'Sarah', LAST_NAME: 'Johnson', CITY: 'San Francisco', STATE: 'CA', PROPERTY_VALUE: 780000 },
  { FIRST_NAME: 'Michael', LAST_NAME: 'Williams', CITY: 'San Diego', STATE: 'CA', PROPERTY_VALUE: 520000 },
  { FIRST_NAME: 'Emily', LAST_NAME: 'Brown', CITY: 'Sacramento', STATE: 'CA', PROPERTY_VALUE: 380000 },
  { FIRST_NAME: 'David', LAST_NAME: 'Jones', CITY: 'Oakland', STATE: 'CA', PROPERTY_VALUE: 620000 },
  { FIRST_NAME: 'Jennifer', LAST_NAME: 'Garcia', CITY: 'Fresno', STATE: 'CA', PROPERTY_VALUE: 290000 },
  { FIRST_NAME: 'Robert', LAST_NAME: 'Martinez', CITY: 'Long Beach', STATE: 'CA', PROPERTY_VALUE: 410000 },
  { FIRST_NAME: 'Lisa', LAST_NAME: 'Anderson', CITY: 'Bakersfield', STATE: 'CA', PROPERTY_VALUE: 275000 },
];

const MOCK_DATA: PreviewStats = {
  scriptName: 'Daily Leads - California',
  totalRows: 2847,
  alreadyProcessed: 1523,
  unprocessed: 1324,
  sampleRows: SAMPLE_ROWS,
};

/**
 * Default preview (view only)
 */
export const Default: Story = {
  args: {
    open: true,
    data: MOCK_DATA,
    onClose: () => console.log('Close'),
  },
};

/**
 * Preview for execution confirmation
 */
export const ForExecution: Story = {
  args: {
    open: true,
    isForExecution: true,
    data: MOCK_DATA,
    onClose: () => console.log('Close'),
    onExecute: () => console.log('Execute'),
  },
};

/**
 * With row limit
 */
export const WithRowLimit: Story = {
  args: {
    open: true,
    isForExecution: true,
    data: MOCK_DATA,
    rowLimit: 500,
    onClose: () => console.log('Close'),
    onExecute: () => console.log('Execute'),
  },
};

/**
 * Large dataset warning
 */
export const LargeDataset: Story = {
  args: {
    open: true,
    isForExecution: true,
    data: {
      ...MOCK_DATA,
      totalRows: 45000,
      alreadyProcessed: 12000,
      unprocessed: 33000,
    },
    onClose: () => console.log('Close'),
    onExecute: () => console.log('Execute'),
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    open: true,
    isLoading: true,
    loadingMessage: 'Querying Snowflake for lead counts...',
    onClose: () => console.log('Close'),
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    open: true,
    error: 'Failed to fetch preview data. Please check your connection and try again.',
    onClose: () => console.log('Close'),
  },
};

/**
 * No sample data
 */
export const NoSampleData: Story = {
  args: {
    open: true,
    data: {
      scriptName: 'Weekly Refinance Pool',
      totalRows: 5000,
      alreadyProcessed: 2000,
      unprocessed: 3000,
    },
    onClose: () => console.log('Close'),
  },
};

/**
 * All processed (nothing to do)
 */
export const AllProcessed: Story = {
  args: {
    open: true,
    isForExecution: true,
    data: {
      scriptName: 'Daily Leads - California',
      totalRows: 2847,
      alreadyProcessed: 2847,
      unprocessed: 0,
    },
    onClose: () => console.log('Close'),
    onExecute: () => console.log('Execute'),
  },
};

/**
 * Interactive example
 */
export const Interactive: Story = {
  render: function InteractiveDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<PreviewStats | undefined>(undefined);

    const handleOpen = () => {
      setOpen(true);
      setIsLoading(true);
      setData(undefined);

      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
        setData(MOCK_DATA);
      }, 2000);
    };

    const handleExecute = () => {
      alert('ETL Job started!');
      setOpen(false);
    };

    return (
      <Box>
        <Button variant="contained" onClick={handleOpen}>
          Open Preview Dialog
        </Button>
        <PreviewDialogCompact
          open={open}
          isForExecution
          isLoading={isLoading}
          loadingMessage="Checking processing status..."
          data={data}
          rowLimit={500}
          onClose={() => setOpen(false)}
          onExecute={handleExecute}
        />
      </Box>
    );
  },
};
