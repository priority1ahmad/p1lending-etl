import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResultsTable } from './ResultsTable';

const meta: Meta<typeof ResultsTable> = {
  title: 'Components/ResultsTable',
  component: ResultsTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
];

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyMessage: 'No ETL results found. Run the pipeline to see data.',
  },
};

export const Error: Story = {
  args: {
    data: [],
    columns,
    error: 'Failed to fetch results from Snowflake. Please check your connection.',
  },
};

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 3 === 0 ? 'pending' : 'active',
    })),
    columns,
  },
};
