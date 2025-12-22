/**
 * ResultsHeader Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ResultsHeader } from './ResultsHeader';

const meta: Meta<typeof ResultsHeader> = {
  title: 'Features/Results/V3/ResultsHeader',
  component: ResultsHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ResultsHeader>;

export const Default: Story = {
  args: {
    jobName: 'CA_Foreclosure_Q4_2024',
    recordCount: 15420,
    litigatorCount: 342,
    processedDate: '2024-12-22T10:30:00Z',
    isExporting: false,
    onExport: () => console.log('Export clicked'),
  },
};

export const Exporting: Story = {
  args: {
    ...Default.args,
    isExporting: true,
  },
};

export const LargeNumbers: Story = {
  args: {
    ...Default.args,
    recordCount: 1234567,
    litigatorCount: 45678,
  },
};

export const NoLitigators: Story = {
  args: {
    ...Default.args,
    litigatorCount: 0,
  },
};

export const AllLitigators: Story = {
  args: {
    ...Default.args,
    recordCount: 100,
    litigatorCount: 100,
  },
};

export const LongJobName: Story = {
  args: {
    ...Default.args,
    jobName: 'TX_Refinance_Investment_Properties_December_2024_Final_Version_Approved',
  },
};
