import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportDialog } from './ImportDialog';

import type { ImportLogEntry } from '../../../services/api/lodasoftImport';

const sampleLogs: ImportLogEntry[] = [
  { timestamp: '2024-01-15T10:30:00Z', level: 'INFO', message: 'Starting import job...' },
  { timestamp: '2024-01-15T10:30:01Z', level: 'INFO', message: 'Connecting to Lodasoft CRM...' },
  { timestamp: '2024-01-15T10:30:02Z', level: 'INFO', message: 'Connected successfully' },
  { timestamp: '2024-01-15T10:30:03Z', level: 'INFO', message: 'Processing batch 1/10 (100 records)' },
  { timestamp: '2024-01-15T10:30:05Z', level: 'WARNING', message: 'Record 45: Invalid phone format, skipped' },
  { timestamp: '2024-01-15T10:30:06Z', level: 'INFO', message: 'Batch 1 complete: 99 imported, 1 failed' },
  { timestamp: '2024-01-15T10:30:07Z', level: 'INFO', message: 'Processing batch 2/10 (100 records)' },
  { timestamp: '2024-01-15T10:30:10Z', level: 'INFO', message: 'Batch 2 complete: 100 imported, 0 failed' },
];

const errorLogs: ImportLogEntry[] = [
  { timestamp: '2024-01-15T10:30:00Z', level: 'INFO', message: 'Starting import job...' },
  { timestamp: '2024-01-15T10:30:01Z', level: 'INFO', message: 'Connecting to Lodasoft CRM...' },
  { timestamp: '2024-01-15T10:30:02Z', level: 'ERROR', message: 'Connection failed: Invalid API token' },
  { timestamp: '2024-01-15T10:30:03Z', level: 'ERROR', message: 'Import aborted' },
];

const meta: Meta<typeof ImportDialog> = {
  title: 'Features/Import/ImportDialog',
  component: ImportDialog,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'loading', 'in_progress', 'completed', 'failed'],
      description: 'Current import status',
    },
    onClose: { action: 'close-clicked' },
    onStartImport: { action: 'start-import-clicked' },
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress percentage',
    },
  },

};

export default meta;
type Story = StoryObj<typeof ImportDialog>;

export const Idle: Story = {
  args: {
    open: true,
    jobName: 'California Leads Q1 2024',
    recordCount: 1250,
    status: 'idle',
  },
};

export const Loading: Story = {
  args: {
    open: true,
    jobName: 'California Leads Q1 2024',
    recordCount: 1250,
    status: 'loading',
    progress: 0,
  },
};

export const InProgress: Story = {
  args: {
    open: true,
    jobName: 'California Leads Q1 2024',
    recordCount: 1000,
    status: 'in_progress',
    progress: 35,
    recordsImported: 350,
    recordsFailed: 2,
    logs: sampleLogs,
  },
};

export const Completed: Story = {
  args: {
    open: true,
    jobName: 'California Leads Q1 2024',
    recordCount: 1000,
    status: 'completed',
    progress: 100,
    recordsImported: 998,
    recordsFailed: 2,
    logs: [...sampleLogs, { timestamp: '2024-01-15T10:31:00Z', level: 'INFO', message: 'Import complete!' }],
  },
};

export const Failed: Story = {
  args: {
    open: true,
    jobName: 'California Leads Q1 2024',
    recordCount: 1000,
    status: 'failed',
    progress: 10,
    recordsImported: 100,
    recordsFailed: 0,
    errorMessage: 'Connection to Lodasoft CRM failed: Invalid API token',
    logs: errorLogs,
  },
};
