import type { Meta, StoryObj } from '@storybook/react';
import { QuickActionCard } from './QuickActionCard';
import {
  PlayArrow,
  Visibility,
  Code,
  Refresh,
  Settings,
  Assessment,
} from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { palette } from '../../../theme';

const meta: Meta<typeof QuickActionCard> = {
  title: 'Features/Dashboard/QuickActionCard',
  component: QuickActionCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Action title',
    },
    description: {
      control: 'text',
      description: 'Action description',
    },
    color: {
      control: 'color',
      description: 'Icon and accent color',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickActionCard>;

// Basic Examples
export const StartNewJob: Story = {
  args: {
    title: 'Start New Job',
    description: 'Create and run a new ETL job with your SQL scripts',
    icon: <PlayArrow sx={{ fontSize: 32 }} />,
    color: palette.accent[500],
    onClick: () => alert('Navigate to Job Management'),
  },
};

export const ViewResults: Story = {
  args: {
    title: 'View Results',
    description: 'Browse and export processed ETL results and data',
    icon: <Visibility sx={{ fontSize: 32 }} />,
    color: palette.primary[800],
    onClick: () => alert('Navigate to Results'),
  },
};

export const ManageScripts: Story = {
  args: {
    title: 'Manage SQL Scripts',
    description: 'Edit and organize your SQL query scripts',
    icon: <Code sx={{ fontSize: 32 }} />,
    color: palette.success[500],
    onClick: () => alert('Navigate to SQL Editor'),
  },
};

export const Rescrub: Story = {
  args: {
    title: 'Rescrub Data',
    description: 'Reprocess existing data with updated compliance checks',
    icon: <Refresh sx={{ fontSize: 32 }} />,
    color: palette.warning[600],
    onClick: () => alert('Navigate to Rescrub'),
  },
};

export const ViewAnalytics: Story = {
  args: {
    title: 'View Analytics',
    description: 'Review performance metrics and processing trends',
    icon: <Assessment sx={{ fontSize: 32 }} />,
    color: palette.accent[600],
    onClick: () => alert('Navigate to Analytics'),
  },
};

// States
export const Disabled: Story = {
  args: {
    title: 'System Settings',
    description: 'Configure system preferences (Admin only)',
    icon: <Settings sx={{ fontSize: 32 }} />,
    color: palette.gray[500],
    disabled: true,
    onClick: () => alert('This should not fire'),
  },
};

export const LongDescription: Story = {
  args: {
    title: 'Advanced Data Processing',
    description:
      'Configure advanced ETL processing options including batch sizing, worker pools, and performance optimization settings',
    icon: <Settings sx={{ fontSize: 32 }} />,
    color: palette.primary[700],
    onClick: () => alert('Navigate to Settings'),
  },
};

// Grid Layout
export const QuickActionsGrid: Story = {
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Start New Job"
            description="Create and run a new ETL job"
            icon={<PlayArrow sx={{ fontSize: 32 }} />}
            color={palette.accent[500]}
            onClick={() => console.log('Start Job')}
          />
        </Grid>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="View Results"
            description="Browse and export results"
            icon={<Visibility sx={{ fontSize: 32 }} />}
            color={palette.primary[800]}
            onClick={() => console.log('View Results')}
          />
        </Grid>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Manage Scripts"
            description="Edit your SQL scripts"
            icon={<Code sx={{ fontSize: 32 }} />}
            color={palette.success[500]}
            onClick={() => console.log('Manage Scripts')}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// Responsive 2-Column Layout
export const TwoColumnLayout: Story = {
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Quick Actions (2-Column)
      </Typography>
      <Grid container spacing={2}>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6}>
          <QuickActionCard
            title="Start Job"
            description="Launch new ETL processing"
            icon={<PlayArrow sx={{ fontSize: 32 }} />}
            color={palette.accent[500]}
            onClick={() => {}}
          />
        </Grid>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6}>
          <QuickActionCard
            title="View Data"
            description="Browse results and export"
            icon={<Visibility sx={{ fontSize: 32 }} />}
            color={palette.primary[800]}
            onClick={() => {}}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};

// Color Variations
export const ColorVariations: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Color Variations
      </Typography>
      <Grid container spacing={2}>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Primary Action"
            description="Primary color theme"
            icon={<PlayArrow sx={{ fontSize: 32 }} />}
            color={palette.primary[800]}
            onClick={() => {}}
          />
        </Grid>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Accent Action"
            description="Accent color theme"
            icon={<Visibility sx={{ fontSize: 32 }} />}
            color={palette.accent[500]}
            onClick={() => {}}
          />
        </Grid>
        {/* @ts-ignore - MUI v7 Grid item prop */}
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Success Action"
            description="Success color theme"
            icon={<Code sx={{ fontSize: 32 }} />}
            color={palette.success[500]}
            onClick={() => {}}
          />
        </Grid>
      </Grid>
    </Box>
  ),
};
