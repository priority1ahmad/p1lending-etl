import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { useState } from 'react';
import { DashboardHome, type DashboardStats, type ActiveJob } from './DashboardHome';
import type { Script } from './CompactJobControl';
import type { JobHistoryItem } from './JobHistoryCompact';

const meta: Meta<typeof DashboardHome> = {
  title: 'Features/Home/DashboardHome',
  component: DashboardHome,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardHome>;

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

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 3600000);
const twoHoursAgo = new Date(now.getTime() - 7200000);
const yesterday = new Date(now.getTime() - 86400000);

const sampleJobHistory: JobHistoryItem[] = [
  {
    id: '1',
    job_type: 'single_script',
    script_name: 'Daily Leads - California',
    status: 'completed',
    total_rows_processed: 1234,
    litigator_count: 89,
    dnc_count: 45,
    clean_count: 1100,
    started_at: oneHourAgo.toISOString(),
    duration: 420,
  },
  {
    id: '2',
    job_type: 'preview',
    script_name: 'Weekly Refinance Pool',
    status: 'completed',
    total_rows_processed: 500,
    started_at: twoHoursAgo.toISOString(),
    duration: 30,
  },
  {
    id: '3',
    job_type: 'single_script',
    script_name: 'High Value Prospects',
    status: 'failed',
    total_rows_processed: 234,
    started_at: yesterday.toISOString(),
    duration: 156,
  },
  {
    id: '4',
    job_type: 'single_script',
    script_name: 'FHA Candidates',
    status: 'completed',
    total_rows_processed: 5678,
    litigator_count: 423,
    dnc_count: 231,
    clean_count: 5024,
    started_at: yesterday.toISOString(),
    duration: 1800,
  },
  {
    id: '5',
    job_type: 'preview',
    script_name: 'Test Preview',
    status: 'completed',
    total_rows_processed: 100,
    started_at: yesterday.toISOString(),
    duration: 15,
  },
];

const sampleStats: DashboardStats = {
  totalProcessed: 45892,
  totalClean: 38450,
  totalLitigator: 4231,
  totalDnc: 3211,
  jobsToday: 12,
  avgProcessingTime: '6m 34s',
};

const sampleActiveJob: ActiveJob = {
  id: 'active-1',
  scriptName: 'Daily Leads - California',
  progress: 45,
  currentRow: 450,
  totalRows: 1000,
  currentBatch: 5,
  totalBatches: 10,
  message: 'Processing idiCORE enrichment...',
  elapsedTime: 180,
  timeRemaining: '4m 30s',
  stats: {
    clean: 380,
    litigator: 45,
    dnc: 25,
  },
};

/**
 * Default state - idle, ready to start a job
 */
export const Default: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
    onViewAllHistory: () => console.log('View all history clicked'),
  },
};

/**
 * With a job currently running
 */
export const WithActiveJob: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    activeJob: sampleActiveJob,
    selectedScriptId: '1',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onStopJob: () => console.log('Stop job clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
    onViewAllHistory: () => console.log('View all history clicked'),
  },
};

/**
 * Active job nearly complete
 */
export const JobNearlyComplete: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    activeJob: {
      ...sampleActiveJob,
      progress: 92,
      currentRow: 920,
      currentBatch: 10,
      message: 'Finalizing DNC checks...',
      elapsedTime: 420,
      timeRemaining: '30s',
      stats: {
        clean: 756,
        litigator: 98,
        dnc: 66,
      },
    },
    selectedScriptId: '1',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onStopJob: () => console.log('Stop job clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    onViewResults: (id) => console.log('View results:', id),
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: [],
    selectedScriptId: '',
    rowLimit: '',
    isLoading: true,
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
  },
};

/**
 * Preview loading
 */
export const PreviewLoading: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    selectedScriptId: '1',
    rowLimit: '100',
    isPreviewLoading: true,
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onViewResults: (id) => console.log('View results:', id),
  },
};

/**
 * Empty state - new user, no history
 */
export const EmptyState: Story = {
  args: {
    stats: {
      totalProcessed: 0,
      totalClean: 0,
      totalLitigator: 0,
      totalDnc: 0,
      jobsToday: 0,
    },
    scripts: sampleScripts,
    jobHistory: [],
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
};

/**
 * Script selected with row limit
 */
export const ScriptSelected: Story = {
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    selectedScriptId: '2',
    rowLimit: '500',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
    onViewAllHistory: () => console.log('View all history clicked'),
  },
};

/**
 * Interactive demo with working state
 */
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [selectedScriptId, setSelectedScriptId] = useState('');
    const [rowLimit, setRowLimit] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isJobLoading, setIsJobLoading] = useState(false);
    const [activeJob, setActiveJob] = useState<ActiveJob | undefined>(undefined);

    const handlePreview = () => {
      setIsPreviewLoading(true);
      setTimeout(() => {
        setIsPreviewLoading(false);
        alert('Preview complete! (In real app, a dialog would open)');
      }, 2000);
    };

    const handleStartETL = () => {
      setIsJobLoading(true);
      setTimeout(() => {
        setIsJobLoading(false);
        setActiveJob({
          id: 'demo-job',
          scriptName:
            sampleScripts.find((s) => s.id === selectedScriptId)?.name ||
            'Unknown',
          progress: 0,
          currentRow: 0,
          totalRows: 1000,
          currentBatch: 1,
          totalBatches: 10,
          message: 'Starting job...',
          elapsedTime: 0,
          stats: { clean: 0, litigator: 0, dnc: 0 },
        });

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (progress >= 100) {
            clearInterval(interval);
            setActiveJob(undefined);
            alert('Job completed!');
            return;
          }
          setActiveJob((prev) =>
            prev
              ? {
                  ...prev,
                  progress,
                  currentRow: Math.floor((progress / 100) * 1000),
                  currentBatch: Math.floor(progress / 10) + 1,
                  elapsedTime: Math.floor(progress * 4.2),
                  message: `Processing batch ${Math.floor(progress / 10) + 1}...`,
                  stats: {
                    clean: Math.floor(((progress / 100) * 1000 * 0.85)),
                    litigator: Math.floor(((progress / 100) * 1000 * 0.1)),
                    dnc: Math.floor(((progress / 100) * 1000 * 0.05)),
                  },
                }
              : undefined
          );
        }, 500);
      }, 1000);
    };

    const handleStopJob = () => {
      setActiveJob(undefined);
      alert('Job stopped!');
    };

    return (
      <DashboardHome
        stats={sampleStats}
        scripts={sampleScripts}
        jobHistory={sampleJobHistory}
        activeJob={activeJob}
        selectedScriptId={selectedScriptId}
        rowLimit={rowLimit}
        isPreviewLoading={isPreviewLoading}
        isJobLoading={isJobLoading}
        onScriptChange={setSelectedScriptId}
        onRowLimitChange={setRowLimit}
        onPreview={handlePreview}
        onStartETL={handleStartETL}
        onStopJob={handleStopJob}
        onRefresh={() => console.log('Refresh')}
        onViewResults={(id) => alert(`View results for job ${id}`)}
        onViewPreview={(id) => alert(`View preview for job ${id}`)}
        onViewAllHistory={() => alert('View all history')}
      />
    );
  },
};

/**
 * Dark background context (simulates app layout)
 */
export const InAppLayout: Story = {
  decorators: [
    (Story) => (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f6f8',
        }}
      >
        {/* Simulated app header */}
        <Box
          sx={{
            height: 56,
            backgroundColor: '#1E3A5F',
            display: 'flex',
            alignItems: 'center',
            px: 3,
          }}
        >
          <Box
            component="span"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.125rem',
            }}
          >
            P1Lending ETL
          </Box>
        </Box>
        <Story />
      </Box>
    ),
  ],
  args: {
    stats: sampleStats,
    scripts: sampleScripts,
    jobHistory: sampleJobHistory,
    activeJob: sampleActiveJob,
    selectedScriptId: '1',
    rowLimit: '',
    onScriptChange: (id) => console.log('Script changed:', id),
    onRowLimitChange: (value) => console.log('Row limit:', value),
    onPreview: () => console.log('Preview clicked'),
    onStartETL: () => console.log('Start ETL clicked'),
    onStopJob: () => console.log('Stop job clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    onViewResults: (id) => console.log('View results:', id),
    onViewPreview: (id) => console.log('View preview:', id),
    onViewAllHistory: () => console.log('View all history clicked'),
  },
};
