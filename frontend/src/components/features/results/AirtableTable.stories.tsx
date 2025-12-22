/**
 * AirtableTable Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AirtableTable } from './AirtableTable';
import { Box } from '@mui/material';

const meta: Meta<typeof AirtableTable> = {
  title: 'Features/Results/V3/AirtableTable',
  component: AirtableTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 500, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AirtableTable>;

// Generate mock records
const generateRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    record_id: `record-${i + 1}`,
    first_name: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'][i % 8],
    last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][i % 8],
    address: `${100 + i * 10} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][i % 5]} Street`,
    city: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Phoenix', 'Chicago', 'Seattle', 'Denver'][i % 8],
    state: ['CA', 'TX', 'FL', 'NY', 'AZ', 'IL', 'WA', 'CO'][i % 8],
    zip_code: `${90000 + i * 100}`,
    phone_1: `(555) ${String(100 + (i % 900)).padStart(3, '0')}-${String(1000 + i * 11).slice(-4)}`,
    phone_2: i % 3 === 0 ? `(555) ${String(200 + (i % 900)).padStart(3, '0')}-${String(2000 + i * 7).slice(-4)}` : undefined,
    phone_3: i % 5 === 0 ? `(555) ${String(300 + (i % 900)).padStart(3, '0')}-${String(3000 + i * 3).slice(-4)}` : undefined,
    email_1: `${['john', 'jane', 'michael', 'sarah', 'david', 'emily', 'robert', 'lisa'][i % 8]}${i + 1}@example.com`,
    email_2: i % 2 === 0 ? `${['john', 'jane', 'michael', 'sarah'][i % 4]}.work@company.com` : undefined,
    email_3: undefined,
    in_litigator_list: i % 7 === 0 ? 'Yes' : 'No',
    processed_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
  }));

export const Default: Story = {
  args: {
    records: generateRecords(50),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    records: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    records: [],
    isLoading: false,
  },
};

export const FewRecords: Story = {
  args: {
    records: generateRecords(5),
    isLoading: false,
  },
};

export const ManyRecords: Story = {
  args: {
    records: generateRecords(500),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Virtual scrolling handles 500+ records efficiently',
      },
    },
  },
};

export const AllLitigators: Story = {
  args: {
    records: generateRecords(10).map((r) => ({ ...r, in_litigator_list: 'Yes' })),
    isLoading: false,
  },
};
