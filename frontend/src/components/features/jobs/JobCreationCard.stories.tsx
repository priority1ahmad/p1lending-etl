import type { Meta, StoryObj } from '@storybook/react';
import { JobCreationCard } from './JobCreationCard';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof JobCreationCard> = {
  title: 'Features/Jobs/JobCreationCard',
  component: JobCreationCard,
  tags: ['autodocs'],
  argTypes: {
    isPreviewLoading: {
      control: 'boolean',
      description: 'Preview loading state',
    },
    isStarting: {
      control: 'boolean',
      description: 'Job starting state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobCreationCard>;

// Sample scripts
const sampleScripts = [
  { id: '1', name: 'Daily Leads - All States' },
  { id: '2', name: 'California Only' },
  { id: '3', name: 'High Value Leads' },
  { id: '4', name: 'Test Query (Small)' },
];

const manyScripts = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Script ${i + 1} - ${['Daily', 'Weekly', 'Monthly'][i % 3]} Batch`,
}));

// Basic Examples
export const Default: Story = {
  args: {
    scripts: sampleScripts,
    onPreview: (id, limit) =>
      console.log('Preview clicked:', { scriptId: id, rowLimit: limit }),
    onStartJob: (id, limit) =>
      console.log('Start job clicked:', { scriptId: id, rowLimit: limit }),
  },
};

export const WithManyScripts: Story = {
  args: {
    scripts: manyScripts,
    onPreview: (id, limit) => console.log('Preview:', id, limit),
    onStartJob: (id, limit) => console.log('Start:', id, limit),
  },
};

export const NoScripts: Story = {
  args: {
    scripts: [],
    onPreview: () => {},
    onStartJob: () => {},
  },
};

// States
export const PreviewLoading: Story = {
  args: {
    scripts: sampleScripts,
    onPreview: () => {},
    onStartJob: () => {},
    isPreviewLoading: true,
  },
};

export const Starting: Story = {
  args: {
    scripts: sampleScripts,
    onPreview: () => {},
    onStartJob: () => {},
    isStarting: true,
  },
};

export const Disabled: Story = {
  args: {
    scripts: sampleScripts,
    onPreview: () => {},
    onStartJob: () => {},
    disabled: true,
  },
};

// Interactive Example
export const Interactive: Story = {
  render: () => {
    const handlePreview = (scriptId: string, rowLimit?: number) => {
      alert(`Preview requested\nScript: ${scriptId}\nRow Limit: ${rowLimit || 'All'}`);
    };

    const handleStartJob = (scriptId: string, rowLimit?: number) => {
      alert(`Job started\nScript: ${scriptId}\nRow Limit: ${rowLimit || 'All'}`);
    };

    return (
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Job Creation Form
        </Typography>
        <JobCreationCard
          scripts={sampleScripts}
          onPreview={handlePreview}
          onStartJob={handleStartJob}
        />
      </Box>
    );
  },
};

// In Page Context
export const InJobManagementPage: Story = {
  render: () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        Job Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create, monitor, and control ETL jobs
      </Typography>

      <Box sx={{ maxWidth: 700 }}>
        <JobCreationCard
          scripts={sampleScripts}
          onPreview={(id, limit) =>
            console.log('Preview:', { scriptId: id, rowLimit: limit })
          }
          onStartJob={(id, limit) =>
            console.log('Start:', { scriptId: id, rowLimit: limit })
          }
        />
      </Box>

      <Box sx={{ mt: 4, p: 2, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Tips:
        </Typography>
        <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
          <li>Select a SQL script to define which records to process</li>
          <li>Optionally set a row limit for testing or partial processing</li>
          <li>Use "Get Preview" to see the first few records before running</li>
          <li>"Start ETL Job" will begin full processing with enrichment and compliance checks</li>
        </Typography>
      </Box>
    </Box>
  ),
};
