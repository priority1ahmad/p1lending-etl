import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { useState } from 'react';
import { CompactJobControl, type Script } from './CompactJobControl';

const meta: Meta<typeof CompactJobControl> = {
  title: 'Features/Home/CompactJobControl',
  component: CompactJobControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompactJobControl>;

const sampleScripts: Script[] = [
  {
    id: '1',
    name: 'Daily Leads - California',
    description: 'Process new leads from California market',
  },
  {
    id: '2',
    name: 'Weekly Refinance Pool',
    description: 'Refinance candidates from last 7 days',
  },
  {
    id: '3',
    name: 'High Value Prospects',
    description: 'Leads with property value > $500k',
  },
  {
    id: '4',
    name: 'FHA Candidates',
    description: 'FHA loan eligible prospects',
  },
];

/**
 * Default state - ready to select
 */
export const Default: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * With script selected
 */
export const ScriptSelected: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '1',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * With script and row limit
 */
export const WithRowLimit: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '2',
    rowLimit: '500',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Preview loading state
 */
export const PreviewLoading: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '1',
    rowLimit: '100',
    isPreviewLoading: true,
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Job creation loading state
 */
export const JobLoading: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '1',
    rowLimit: '',
    isJobLoading: true,
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Job currently running - controls disabled
 */
export const JobRunning: Story = {
  args: {
    scripts: sampleScripts,
    selectedScriptId: '1',
    rowLimit: '',
    isJobRunning: true,
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Empty scripts list
 */
export const NoScripts: Story = {
  args: {
    scripts: [],
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Interactive example with state
 */
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [selectedScriptId, setSelectedScriptId] = useState('');
    const [rowLimit, setRowLimit] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isJobLoading, setIsJobLoading] = useState(false);

    const handlePreview = () => {
      setIsPreviewLoading(true);
      setTimeout(() => {
        setIsPreviewLoading(false);
        alert('Preview complete!');
      }, 2000);
    };

    const handleStartETL = () => {
      setIsJobLoading(true);
      setTimeout(() => {
        setIsJobLoading(false);
        alert('Job started!');
      }, 1500);
    };

    return (
      <CompactJobControl
        scripts={sampleScripts}
        selectedScriptId={selectedScriptId}
        rowLimit={rowLimit}
        isPreviewLoading={isPreviewLoading}
        isJobLoading={isJobLoading}
        onScriptChange={setSelectedScriptId}
        onRowLimitChange={setRowLimit}
        onPreview={handlePreview}
        onStartETL={handleStartETL}
      />
    );
  },
};

/**
 * In context - shows placement in dashboard
 */
export const InContext: Story = {
  decorators: [
    (Story) => (
      <Box
        sx={{
          p: 3,
          backgroundColor: '#f8f9fa',
          minHeight: 300,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box
            component="h2"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 0.5,
              margin: 0,
            }}
          >
            Start a New Job
          </Box>
          <Box
            component="p"
            sx={{ color: '#666', fontSize: '0.75rem', margin: 0 }}
          >
            Select a script and configure options
          </Box>
        </Box>
        <Story />
      </Box>
    ),
  ],
  args: {
    scripts: sampleScripts,
    selectedScriptId: '1',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};
