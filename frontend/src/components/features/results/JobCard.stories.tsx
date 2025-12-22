/**
 * JobCard Stories
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobCard } from './JobCard';
import { Box } from '@mui/material';

const meta: Meta<typeof JobCard> = {
  title: 'Features/Results/V3/JobCard',
  component: JobCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 220 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobCard>;

export const Default: Story = {
  args: {
    jobId: 'abc123',
    jobName: 'CA_Foreclosure_Q4_2024',
    recordCount: 15420,
    lastProcessed: '2024-12-22T10:30:00Z',
    isSelected: false,
    onClick: () => console.log('Clicked'),
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
};

export const LongName: Story = {
  args: {
    ...Default.args,
    jobName: 'TX_Refinance_Investment_Properties_December_2024_Final',
  },
};

export const SmallCount: Story = {
  args: {
    ...Default.args,
    recordCount: 42,
  },
};

export const LargeCount: Story = {
  args: {
    ...Default.args,
    recordCount: 1234567,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <JobCard
        jobId="1"
        jobName="CA_Foreclosure_Q4_2024"
        recordCount={15420}
        lastProcessed="2024-12-22T10:30:00Z"
        isSelected={true}
        onClick={() => {}}
      />
      <JobCard
        jobId="2"
        jobName="TX_Refinance_Dec_2024"
        recordCount={8750}
        lastProcessed="2024-12-21T15:45:00Z"
        isSelected={false}
        onClick={() => {}}
      />
      <JobCard
        jobId="3"
        jobName="FL_Purchase_Winter"
        recordCount={12300}
        lastProcessed="2024-12-20T09:15:00Z"
        isSelected={false}
        onClick={() => {}}
      />
    </Box>
  ),
};
