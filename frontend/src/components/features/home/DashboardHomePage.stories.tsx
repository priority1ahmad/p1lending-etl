import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { DashboardHome, type DashboardStats, type ActiveJob } from './DashboardHome';
import { PreviewDialogCompact, type PreviewStats } from './PreviewDialogCompact';
import type { Script } from './CompactJobControl';
import type { JobHistoryItem } from './JobHistoryCompact';
import type { ActivityItem, ActivityType } from './ActivityFeed';
import theme from '../../../theme';

/**
 * # Dashboard Home Page
 *
 * This is the new compact, Airtable-inspired home page layout for the P1Lending ETL application.
 *
 * ## Design Principles
 * - **Inverted Pyramid**: Most important info at top (stats), actions in middle, details at bottom
 * - **F-Pattern Scanning**: Key metrics in top-left, horizontal action flow
 * - **Compact & Dense**: Information-rich without overwhelming
 * - **Real-time Updates**: Active job card with live progress
 *
 * ## Layout Structure
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Header: "ETL Dashboard" + Refresh/Settings buttons         │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Quick Stats Row: Total | Clean | Litigator | DNC | Jobs    │
 * ├──────────────────────────────────┬──────────────────────────┤
 * │  Active Job Card (if running)    │                          │
 * │  ────────────────────────────    │   Job History Compact    │
 * │  ETL Control Panel               │   (Recent jobs list)     │
 * │  ────────────────────────────    │                          │
 * │  Activity Feed (placeholder)     │                          │
 * └──────────────────────────────────┴──────────────────────────┘
 * ```
 */
const meta: Meta<typeof DashboardHome> = {
  title: 'Pages/DashboardHomePage',
  component: DashboardHome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete dashboard home page with ETL controls, job status, and history.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6f8' }}>
          <Story />
        </Box>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardHome>;

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════

const MOCK_SCRIPTS: Script[] = [
  {
    id: 'script-001',
    name: 'Daily Leads - California',
    description: 'Process new mortgage leads from California market. Includes LA, SF, San Diego metros.',
  },
  {
    id: 'script-002',
    name: 'Weekly Refinance Pool',
    description: 'Refinance candidates identified in the last 7 days with favorable LTV ratios.',
  },
  {
    id: 'script-003',
    name: 'High Value Prospects',
    description: 'Leads with estimated property value > $500,000 and strong credit indicators.',
  },
  {
    id: 'script-004',
    name: 'FHA Candidates',
    description: 'First-time homebuyers eligible for FHA loan programs.',
  },
  {
    id: 'script-005',
    name: 'VA Eligible Veterans',
    description: 'Military veterans eligible for VA loan benefits.',
  },
  {
    id: 'script-006',
    name: 'Monthly Full Export',
    description: 'Complete monthly export of all unprocessed leads across all markets.',
  },
];

const now = new Date();
const createDate = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();

const MOCK_JOB_HISTORY: JobHistoryItem[] = [
  {
    id: 'job-001',
    job_type: 'single_script',
    script_name: 'Daily Leads - California',
    status: 'completed',
    total_rows_processed: 2847,
    litigator_count: 156,
    dnc_count: 89,
    clean_count: 2602,
    started_at: createDate(1),
    completed_at: createDate(0.5),
    duration: 1800,
  },
  {
    id: 'job-002',
    job_type: 'preview',
    script_name: 'Weekly Refinance Pool',
    status: 'completed',
    total_rows_processed: 500,
    started_at: createDate(2),
    duration: 45,
  },
  {
    id: 'job-003',
    job_type: 'single_script',
    script_name: 'High Value Prospects',
    status: 'completed',
    total_rows_processed: 1234,
    litigator_count: 67,
    dnc_count: 45,
    clean_count: 1122,
    started_at: createDate(5),
    completed_at: createDate(4.5),
    duration: 1200,
  },
  {
    id: 'job-004',
    job_type: 'single_script',
    script_name: 'FHA Candidates',
    status: 'failed',
    total_rows_processed: 234,
    started_at: createDate(8),
    duration: 156,
  },
  {
    id: 'job-005',
    job_type: 'preview',
    script_name: 'VA Eligible Veterans',
    status: 'completed',
    total_rows_processed: 100,
    started_at: createDate(12),
    duration: 20,
  },
  {
    id: 'job-006',
    job_type: 'single_script',
    script_name: 'Monthly Full Export',
    status: 'completed',
    total_rows_processed: 45678,
    litigator_count: 3421,
    dnc_count: 1876,
    clean_count: 40381,
    started_at: createDate(24),
    completed_at: createDate(22),
    duration: 7200,
  },
  {
    id: 'job-007',
    job_type: 'single_script',
    script_name: 'Daily Leads - California',
    status: 'cancelled',
    total_rows_processed: 500,
    started_at: createDate(26),
    duration: 300,
  },
  {
    id: 'job-008',
    job_type: 'preview',
    script_name: 'High Value Prospects',
    status: 'completed',
    total_rows_processed: 250,
    started_at: createDate(30),
    duration: 35,
  },
];

const MOCK_STATS: DashboardStats = {
  totalProcessed: 127834,
  totalClean: 108259,
  totalLitigator: 12021,
  totalDnc: 7554,
  jobsToday: 8,
  avgProcessingTime: '12m 45s',
};

const MOCK_ACTIVE_JOB: ActiveJob = {
  id: 'active-job-001',
  scriptName: 'Weekly Refinance Pool',
  progress: 42,
  currentRow: 1260,
  totalRows: 3000,
  currentBatch: 5,
  totalBatches: 12,
  message: 'Processing idiCORE enrichment - batch 5 of 12...',
  elapsedTime: 312,
  timeRemaining: '7m 15s',
  stats: {
    clean: 1058,
    litigator: 134,
    dnc: 68,
  },
};

// ═══════════════════════════════════════════════════════════════
// STORIES
// ═══════════════════════════════════════════════════════════════

/**
 * ## Default State
 * The dashboard when no job is running. Shows stats, history, and ready-to-use controls.
 */
export const Default: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onRefresh: () => {},
    onViewResults: () => {},
    onViewPreview: () => {},
    onViewAllHistory: () => {},
  },
};

/**
 * ## With Active Job
 * Shows the dashboard when an ETL job is actively running.
 * The ActiveJobCard appears above the controls with real-time progress.
 */
export const WithActiveJob: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    activeJob: MOCK_ACTIVE_JOB,
    selectedScriptId: 'script-002',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onStopJob: () => {},
    onRefresh: () => {},
    onViewResults: () => {},
    onViewPreview: () => {},
    onViewAllHistory: () => {},
  },
};

/**
 * ## Job Nearly Complete
 * Shows the dashboard when a job is about to finish (92% progress).
 */
export const JobNearlyComplete: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    activeJob: {
      ...MOCK_ACTIVE_JOB,
      progress: 92,
      currentRow: 2760,
      currentBatch: 11,
      message: 'Finalizing DNC validation checks...',
      elapsedTime: 720,
      timeRemaining: '45s',
      stats: {
        clean: 2318,
        litigator: 289,
        dnc: 153,
      },
    },
    selectedScriptId: 'script-002',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onStopJob: () => {},
    onRefresh: () => {},
    onViewResults: () => {},
  },
};

/**
 * ## Upload Phase
 * Shows the dashboard when a job is uploading results to Snowflake.
 */
export const UploadPhase: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    activeJob: {
      ...MOCK_ACTIVE_JOB,
      progress: 100,
      currentRow: 3000,
      currentBatch: 12,
      message: 'Uploading 3,000 records to Snowflake MASTER_PROCESSED_DB...',
      elapsedTime: 780,
      timeRemaining: undefined,
      stats: {
        clean: 2520,
        litigator: 315,
        dnc: 165,
      },
    },
    selectedScriptId: 'script-002',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onStopJob: () => {},
  },
};

/**
 * ## Script Selected
 * Shows the dashboard with a script selected and row limit configured.
 */
export const ScriptSelected: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    selectedScriptId: 'script-003',
    rowLimit: '500',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onRefresh: () => {},
    onViewResults: () => {},
    onViewPreview: () => {},
    onViewAllHistory: () => {},
  },
};

/**
 * ## Empty State
 * Shows the dashboard for a new user with no job history.
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
    scripts: MOCK_SCRIPTS,
    jobHistory: [],
    selectedScriptId: '',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onRefresh: () => {},
  },
};

/**
 * ## Loading State
 * Shows the dashboard while data is being fetched.
 */
export const Loading: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: [],
    jobHistory: [],
    selectedScriptId: '',
    rowLimit: '',
    isLoading: true,
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
  },
};

/**
 * ## Preview Loading
 * Shows the dashboard while a preview is being generated.
 */
export const PreviewLoading: Story = {
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    selectedScriptId: 'script-001',
    rowLimit: '100',
    isPreviewLoading: true,
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onViewResults: () => {},
  },
};

/**
 * ## Interactive Demo
 * A fully interactive demo with working state management.
 * Select a script, set row limit, and click "Run ETL" to see the job progress simulation.
 */
export const InteractiveDemo: Story = {
  render: function InteractiveDashboard() {
    const [selectedScriptId, setSelectedScriptId] = useState('');
    const [rowLimit, setRowLimit] = useState('');
    const [isPreviewLoading] = useState(false);
    const [isJobLoading, setIsJobLoading] = useState(false);
    const [activeJob, setActiveJob] = useState<ActiveJob | undefined>(undefined);
    const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>(MOCK_JOB_HISTORY);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const activityIdRef = useRef(0);

    // Preview dialog state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIsForExecution, setPreviewIsForExecution] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewStats | undefined>(undefined);

    // Helper to add activity
    const addActivity = (type: ActivityType, message: string, details?: string, count?: number) => {
      activityIdRef.current += 1;
      setActivities((prev) => [
        ...prev,
        {
          id: `activity-${activityIdRef.current}`,
          type,
          message,
          timestamp: new Date().toISOString(),
          details,
          count,
        },
      ]);
    };

    const handlePreview = () => {
      if (!selectedScriptId) return;
      const script = MOCK_SCRIPTS.find((s) => s.id === selectedScriptId);

      setPreviewOpen(true);
      setPreviewIsForExecution(false);
      setPreviewLoading(true);
      setPreviewData(undefined);

      // Simulate loading
      setTimeout(() => {
        setPreviewLoading(false);
        setPreviewData({
          scriptName: script?.name || 'Unknown Script',
          totalRows: 2847,
          alreadyProcessed: 1523,
          unprocessed: 1324,
          sampleRows: [
            { FIRST_NAME: 'John', LAST_NAME: 'Smith', CITY: 'Los Angeles', STATE: 'CA', PROPERTY_VALUE: 450000 },
            { FIRST_NAME: 'Sarah', LAST_NAME: 'Johnson', CITY: 'San Francisco', STATE: 'CA', PROPERTY_VALUE: 780000 },
            { FIRST_NAME: 'Michael', LAST_NAME: 'Williams', CITY: 'San Diego', STATE: 'CA', PROPERTY_VALUE: 520000 },
            { FIRST_NAME: 'Emily', LAST_NAME: 'Brown', CITY: 'Sacramento', STATE: 'CA', PROPERTY_VALUE: 380000 },
            { FIRST_NAME: 'David', LAST_NAME: 'Jones', CITY: 'Oakland', STATE: 'CA', PROPERTY_VALUE: 620000 },
          ],
        });

        // Add preview to history
        setJobHistory((prev) => [
          {
            id: `preview-${Date.now()}`,
            job_type: 'preview',
            script_name: script?.name || 'Unknown',
            status: 'completed',
            total_rows_processed: parseInt(rowLimit) || 100,
            started_at: new Date().toISOString(),
            duration: 25,
          },
          ...prev,
        ]);
      }, 1500);
    };

    const handleStartETL = () => {
      if (!selectedScriptId) return;
      const script = MOCK_SCRIPTS.find((s) => s.id === selectedScriptId);

      // Show preview dialog for confirmation first
      setPreviewOpen(true);
      setPreviewIsForExecution(true);
      setPreviewLoading(true);
      setPreviewData(undefined);

      setTimeout(() => {
        setPreviewLoading(false);
        setPreviewData({
          scriptName: script?.name || 'Unknown Script',
          totalRows: 2847,
          alreadyProcessed: 1523,
          unprocessed: 1324,
          sampleRows: [
            { FIRST_NAME: 'John', LAST_NAME: 'Smith', CITY: 'Los Angeles', STATE: 'CA', PROPERTY_VALUE: 450000 },
            { FIRST_NAME: 'Sarah', LAST_NAME: 'Johnson', CITY: 'San Francisco', STATE: 'CA', PROPERTY_VALUE: 780000 },
            { FIRST_NAME: 'Michael', LAST_NAME: 'Williams', CITY: 'San Diego', STATE: 'CA', PROPERTY_VALUE: 520000 },
          ],
        });
      }, 1500);
    };

    const handleExecuteFromPreview = () => {
      setPreviewOpen(false);

      const script = MOCK_SCRIPTS.find((s) => s.id === selectedScriptId);
      const totalRows = parseInt(rowLimit) || 1324; // Use unprocessed count

      // Clear previous activities and start fresh
      setActivities([]);
      activityIdRef.current = 0;

      setIsJobLoading(true);
      setTimeout(() => {
        setIsJobLoading(false);

        // Add initial activities
        addActivity('start', 'ETL job started', `Script: ${script?.name || 'Unknown'}`);

        setActiveJob({
          id: `job-${Date.now()}`,
          scriptName: script?.name || 'Unknown Script',
          progress: 0,
          currentRow: 0,
          totalRows,
          currentBatch: 1,
          totalBatches: Math.ceil(totalRows / 250),
          message: 'Initializing job...',
          elapsedTime: 0,
          stats: { clean: 0, litigator: 0, dnc: 0 },
        });
      }, 500);
    };

    // Simulate job progress with activity generation
    useEffect(() => {
      if (!activeJob || activeJob.progress >= 100) return;

      const interval = setInterval(() => {
        setActiveJob((prev) => {
          if (!prev) return undefined;

          const newProgress = Math.min(prev.progress + 2, 100);
          const totalRows = prev.totalRows || 1000;
          const currentRow = Math.floor((newProgress / 100) * totalRows);
          const currentBatch = Math.floor((newProgress / 100) * (prev.totalBatches || 10)) + 1;
          const prevBatch = prev.currentBatch || 1;

          // Generate activities at key progress points
          if (newProgress === 2) {
            addActivity('snowflake', 'Querying Snowflake database', 'Connecting to bulk_property_data_private_share_usa');
          } else if (newProgress === 6) {
            addActivity('info', 'Query complete', undefined, prev.totalRows);
          } else if (newProgress === 10) {
            addActivity('batch', 'Starting batch processing', `Processing in ${prev.totalBatches} batches`);
          } else if (currentBatch !== prevBatch && currentBatch <= (prev.totalBatches || 10)) {
            // New batch started - add activities
            const batchNum = currentBatch;
            addActivity('idicore', `idiCORE enrichment - Batch ${batchNum}/${prev.totalBatches}`, undefined, 250);

            // Randomly add some results
            setTimeout(() => {
              const litigatorCount = Math.floor(Math.random() * 20) + 5;
              const dncCount = Math.floor(Math.random() * 15) + 3;
              addActivity('ccc', 'Litigators identified', undefined, litigatorCount);
              setTimeout(() => {
                addActivity('dnc', 'DNC matches found', undefined, dncCount);
              }, 200);
            }, 300);
          }

          // Job complete
          if (newProgress >= 100) {
            clearInterval(interval);
            addActivity('upload', 'Uploading to Snowflake', 'Writing to MASTER_PROCESSED_DB');
            setTimeout(() => {
              const rowsTotal = prev.totalRows || 1000;
              const cleanCount = Math.floor(rowsTotal * 0.84);
              const litigatorCount = Math.floor(rowsTotal * 0.1);
              const dncCount = Math.floor(rowsTotal * 0.06);
              addActivity(
                'success',
                'ETL job completed!',
                `Clean: ${cleanCount.toLocaleString()} • Litigator: ${litigatorCount.toLocaleString()} • DNC: ${dncCount.toLocaleString()}`,
                prev.totalRows
              );
              setTimeout(() => {
                setActiveJob(undefined);
                setActivities([]);
                setJobHistory((history) => [
                  {
                    id: prev.id,
                    job_type: 'single_script',
                    script_name: prev.scriptName,
                    status: 'completed',
                    total_rows_processed: prev.totalRows,
                    litigator_count: litigatorCount,
                    dnc_count: dncCount,
                    clean_count: cleanCount,
                    started_at: new Date(Date.now() - (prev.elapsedTime || 0) * 1000).toISOString(),
                    completed_at: new Date().toISOString(),
                    duration: prev.elapsedTime || 0,
                  },
                  ...history,
                ]);
              }, 1500);
            }, 500);
          }

          const messages = [
            'Querying Snowflake for lead data...',
            'Processing idiCORE enrichment...',
            'Validating against CCC Litigator API...',
            'Checking DNC database...',
            'Finalizing compliance checks...',
            'Uploading results to Snowflake...',
          ];
          const messageIndex = Math.min(
            Math.floor(newProgress / 20),
            messages.length - 1
          );

          return {
            ...prev,
            progress: newProgress,
            currentRow,
            currentBatch: Math.min(currentBatch, prev.totalBatches || 10),
            message: messages[messageIndex],
            elapsedTime: (prev.elapsedTime || 0) + 1,
            timeRemaining:
              newProgress < 100
                ? `${Math.ceil(((100 - newProgress) / 2) * 0.5)}s`
                : undefined,
            stats: {
              clean: Math.floor(currentRow * 0.84),
              litigator: Math.floor(currentRow * 0.1),
              dnc: Math.floor(currentRow * 0.06),
            },
          };
        });
      }, 500);

      return () => clearInterval(interval);
    }, [activeJob?.id, activeJob?.progress]);

    const handleStopJob = () => {
      if (!activeJob) return;
      addActivity('stop', 'Job cancelled by user');
      setJobHistory((prev) => [
        {
          id: activeJob.id,
          job_type: 'single_script',
          script_name: activeJob.scriptName,
          status: 'cancelled',
          total_rows_processed: activeJob.currentRow || 0,
          started_at: new Date(Date.now() - (activeJob.elapsedTime || 0) * 1000).toISOString(),
          duration: activeJob.elapsedTime || 0,
        },
        ...prev,
      ]);
      setTimeout(() => {
        setActiveJob(undefined);
        setActivities([]);
      }, 1000);
    };

    return (
      <>
        <DashboardHome
          stats={MOCK_STATS}
          scripts={MOCK_SCRIPTS}
          jobHistory={jobHistory}
          activeJob={activeJob}
          activities={activities}
          selectedScriptId={selectedScriptId}
          rowLimit={rowLimit}
          isPreviewLoading={isPreviewLoading}
          isJobLoading={isJobLoading}
          onScriptChange={setSelectedScriptId}
          onRowLimitChange={setRowLimit}
          onPreview={handlePreview}
          onStartETL={handleStartETL}
          onStopJob={handleStopJob}
          onRefresh={() => window.location.reload()}
          onViewResults={(id) => alert(`Navigate to /results?job_id=${id}`)}
          onViewPreview={(id) => alert(`View preview ${id}`)}
          onViewAllHistory={() => alert('Navigate to /history')}
          onOpenSettings={() => alert('Navigate to /settings')}
        />

        {/* Preview Dialog */}
        <PreviewDialogCompact
          open={previewOpen}
          isForExecution={previewIsForExecution}
          isLoading={previewLoading}
          loadingMessage="Checking processing status..."
          data={previewData}
          rowLimit={rowLimit ? parseInt(rowLimit) : undefined}
          onClose={() => setPreviewOpen(false)}
          onExecute={handleExecuteFromPreview}
        />
      </>
    );
  },
};

/**
 * ## Full App Layout
 * Shows the dashboard within a simulated app shell with header.
 */
export const FullAppLayout: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6f8' }}>
          {/* Simulated App Header */}
          <Box
            sx={{
              height: 56,
              backgroundColor: '#1E3A5F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="span"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  letterSpacing: '-0.01em',
                }}
              >
                P1Lending ETL
              </Box>
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  gap: 0.5,
                  ml: 4,
                }}
              >
                {['Dashboard', 'Results', 'Scripts', 'Settings'].map((item, i) => (
                  <Box
                    key={item}
                    component="span"
                    sx={{
                      color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.875rem',
                      fontWeight: i === 0 ? 600 : 400,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      backgroundColor: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="span"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.75rem',
                }}
              >
                Logged in as <strong>aallouch</strong>
              </Box>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#4A90D9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                AA
              </Box>
            </Box>
          </Box>
          <Story />
        </Box>
      </ThemeProvider>
    ),
  ],
  args: {
    stats: MOCK_STATS,
    scripts: MOCK_SCRIPTS,
    jobHistory: MOCK_JOB_HISTORY,
    activeJob: MOCK_ACTIVE_JOB,
    selectedScriptId: 'script-002',
    rowLimit: '',
    onScriptChange: () => {},
    onRowLimitChange: () => {},
    onPreview: () => {},
    onStartETL: () => {},
    onStopJob: () => {},
    onRefresh: () => {},
    onViewResults: () => {},
    onViewPreview: () => {},
    onViewAllHistory: () => {},
  },
};
