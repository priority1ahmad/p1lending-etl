/**
 * DateRangeSelector Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import DateRangeSelector, { type DateRange } from './DateRangeSelector';

const meta: Meta<typeof DateRangeSelector> = {
  title: 'Features/Dashboard/DateRangeSelector',
  component: DateRangeSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof DateRangeSelector>;

/**
 * Interactive date range selector
 */
export const Default: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>('week');
    return (
      <DateRangeSelector
        value={range}
        onChange={setRange}
      />
    );
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    value: 'week',
    disabled: true,
  },
};

/**
 * Month selected
 */
export const MonthSelected: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>('month');
    return (
      <DateRangeSelector
        value={range}
        onChange={setRange}
      />
    );
  },
};

/**
 * Today selected
 */
export const TodaySelected: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>('today');
    return (
      <DateRangeSelector
        value={range}
        onChange={setRange}
      />
    );
  },
};
