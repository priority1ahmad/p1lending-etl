/**
 * DashboardSection Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import DashboardSection from './DashboardSection';
import { Card } from '../../ui/Card/Card';

const meta: Meta<typeof DashboardSection> = {
  title: 'Features/Dashboard/DashboardSection',
  component: DashboardSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardSection>;

export const Default: Story = {
  args: {
    title: 'Overview',
    subtitle: 'Key metrics at a glance',
    children: (
      <Card>
        <Box sx={{ p: 2 }}>
          <Typography>Content goes here</Typography>
        </Box>
      </Card>
    ),
  },
};

export const WithoutSubtitle: Story = {
  args: {
    title: 'Quick Actions',
    children: (
      <Card>
        <Box sx={{ p: 2 }}>
          <Typography>Content goes here</Typography>
        </Box>
      </Card>
    ),
  },
};

export const WithGrid: Story = {
  args: {
    title: 'Performance Metrics',
    subtitle: 'Detailed KPIs and statistics',
    children: (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        <Card padding="md">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Metric 1
          </Typography>
          <Typography variant="h4">1,234</Typography>
        </Card>
        <Card padding="md">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Metric 2
          </Typography>
          <Typography variant="h4">5,678</Typography>
        </Card>
        <Card padding="md">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Metric 3
          </Typography>
          <Typography variant="h4">9,012</Typography>
        </Card>
      </Box>
    ),
  },
};
