/**
 * TableFooter Stories
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableFooter } from './TableFooter';

const meta: Meta<typeof TableFooter> = {
  title: 'Features/Results/V3/TableFooter',
  component: TableFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TableFooter>;

export const Default: Story = {
  args: {
    total: 15420,
    currentPage: 1,
    recordsPerPage: 100,
    excludeLitigators: false,
    onPageChange: (page) => console.log('Page:', page),
    onToggleExclude: (exclude) => console.log('Exclude:', exclude),
  },
};

export const MiddlePage: Story = {
  args: {
    ...Default.args,
    currentPage: 50,
  },
};

export const LastPage: Story = {
  args: {
    ...Default.args,
    currentPage: 155,
  },
};

export const ExcludingLitigators: Story = {
  args: {
    ...Default.args,
    total: 15078,
    excludeLitigators: true,
  },
};

export const SmallDataset: Story = {
  args: {
    ...Default.args,
    total: 42,
  },
};

export const SinglePage: Story = {
  args: {
    ...Default.args,
    total: 50,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    total: 0,
  },
};
