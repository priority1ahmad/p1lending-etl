/**
 * Dashboard Page
 * Main ETL control interface - orchestrates all feature components
 *
 * Reduced from ~1700 lines to ~200 lines through component extraction
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../services/api/jobs';
import type { ETLJob } from '../../services/api/jobs';

// Layout components
import { PageHeader } from '../../components/layout/PageHeader';

// Feature components
import {
  ETLControlPanel,
  JobStatusCard,
  JobStatisticsCard,
  JobHistoryTable,
  LiveLogsPanel,
  ProcessingStatusTable,
  PreviewDialog,
  LogFileViewerDialog,
  type LogEntry,
  type ProcessedRow,
  type PreviewItem,
  type JobHistoryItem,
} from '../../components/features/etl';

// Hooks
import { useDashboardData } from './useDashboardData';
import { useJobSocket, toProcessedRow } from './useJobSocket';

const MAX_PROCESSED_ROWS = 50;

export function Dashboard() {
  const queryClient = useQueryClient();

  // Data fetching
  const {
    scripts,
    latestJob,
    jobHistory,
    jobHistoryMessage,
    createJob,
    cancelJob,
    previewJob,
    fetchLogFile,
  } = useDashboardData();

  // Local state
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [rowLimit, setRowLimit] = useState('');
  const [currentJob, setCurrentJob] = useState<ETLJob | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [previewLoadingMessage, setPreviewLoadingMessage] = useState('Initializing preview...');
  const [previewForExecution, setPreviewForExecution] = useState(false);

  // Log viewer state
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [logFileContent, setLogFileContent] = useState('');
  const [logFileLoading, setLogFileLoading] = useState(false);

  // Log filters
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Preview polling ref
  const messageIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync latest job to current job
  useEffect(() => {
    if (latestJob) {
      setCurrentJob(latestJob);
    }
  }, [latestJob]);

  // Fetch initial logs when job starts
  useEffect(() => {
    if (currentJob?.status === 'running' && currentJob.id) {
      jobsApi.getLogs(currentJob.id, 0, 1000).then((initialLogs) => {
        if (initialLogs?.length > 0) {
          setLogs(
            initialLogs.map((log) => ({
              level: log.level || 'INFO',
              message: log.message,
              timestamp: log.created_at || new Date().toISOString(),
            }))
          );
        }
      }).catch((err) => console.error('Failed to fetch initial logs:', err));
    } else if (!currentJob || currentJob.status !== 'running') {
      setLogs([]);
    }
  }, [currentJob?.id, currentJob?.status]);

  // Socket callbacks
  const handleProgress = useCallback((data: any) => {
    setCurrentJob((prev) =>
      prev
        ? {
            ...prev,
            progress: data.progress ?? prev.progress,
            message: data.message ?? prev.message,
            current_row: data.current_row,
            total_rows: data.total_rows,
            rows_remaining: data.rows_remaining,
            current_batch: data.current_batch,
            total_batches: data.total_batches,
          }
        : null
    );
  }, []);

  const handleBatchProgress = useCallback((data: any) => {
    setCurrentJob((prev) =>
      prev
        ? {
            ...prev,
            current_batch: data.current_batch,
            total_batches: data.total_batches,
            message: data.message ?? prev.message,
          }
        : null
    );
  }, []);

  const handleRowProcessed = useCallback((data: any) => {
    if (data.row_data) {
      setProcessedRows((prev) => {
        const newRow = toProcessedRow(data, prev.length);
        return [...prev, newRow].slice(-MAX_PROCESSED_ROWS);
      });
    }
  }, []);

  const handleLog = useCallback((data: any) => {
    setLogs((prev) => [
      ...prev,
      {
        level: data.level || 'INFO',
        message: data.message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleComplete = useCallback((data: any) => {
    setCurrentJob((prev) => (prev ? { ...prev, status: 'completed', progress: 100, ...data } : null));
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [queryClient]);

  const handleError = useCallback((data: any) => {
    setCurrentJob((prev) => (prev ? { ...prev, status: 'failed', error_message: data.error } : null));
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [queryClient]);

  // Connect to job socket
  useJobSocket({
    job: currentJob,
    onProgress: handleProgress,
    onBatchProgress: handleBatchProgress,
    onRowProcessed: handleRowProcessed,
    onLog: handleLog,
    onComplete: handleComplete,
    onError: handleError,
  });

  // Handlers
  const handleStartETL = () => {
    if (!selectedScriptId) {
      alert('Please select a script');
      return;
    }
    handleGetPreview(true);
  };

  const handleConfirmAndExecuteETL = () => {
    if (!selectedScriptId) return;

    setPreviewDialogOpen(false);
    setPreviewForExecution(false);
    previewJob.reset();

    createJob.mutate({
      script_id: selectedScriptId,
      job_type: 'single_script',
      row_limit: rowLimit ? parseInt(rowLimit) : undefined,
    });

    setProcessedRows([]);
  };

  const handleGetPreview = (isForExecution = false) => {
    if (!selectedScriptId) {
      alert('Please select a script');
      return;
    }

    setPreviewForExecution(isForExecution);
    setPreviewDialogOpen(true);
    setPreviewData([]);
    setPreviewLoadingMessage('Initializing preview...');

    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }

    // Poll for preview job status
    messageIntervalRef.current = setInterval(async () => {
      if (previewJob.isPending) {
        try {
          const response = await jobsApi.list(0, 10);
          const previewJobs = response.jobs.filter(
            (job) =>
              job.job_type === 'preview' &&
              job.script_id === selectedScriptId &&
              (job.status === 'running' || job.status === 'pending')
          );

          if (previewJobs.length > 0 && previewJobs[0].message) {
            setPreviewLoadingMessage(previewJobs[0].message);
          }
        } catch {
          // Silently fail
        }
      }
    }, 500);

    previewJob.mutate(
      {
        scriptIds: [selectedScriptId],
        rowLimit: rowLimit ? parseInt(rowLimit) : undefined,
      },
      {
        onSettled: () => {
          if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
          }
        },
        onSuccess: (data) => {
          setPreviewData(data as PreviewItem[]);
        },
      }
    );
  };

  const handleCancel = () => {
    if (currentJob) {
      cancelJob.mutate(currentJob.id);
    }
  };

  const handleViewLogFile = async () => {
    if (!currentJob) return;
    setLogFileLoading(true);
    try {
      const data = await fetchLogFile(currentJob.id);
      setLogFileContent(data.content);
      setLogViewerOpen(true);
    } catch {
      // Handle error
    } finally {
      setLogFileLoading(false);
    }
  };

  const handleToggleRow = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  };

  const handleViewHistoryPreview = (job: JobHistoryItem) => {
    if (job.script_id) {
      setPreviewDialogOpen(true);
      setPreviewLoadingMessage('Loading preview data...');
      previewJob.mutate(
        { scriptIds: [job.script_id], rowLimit: job.row_limit },
        {
          onSuccess: (data) => {
            setPreviewData(data as PreviewItem[]);
          },
        }
      );
    }
  };

  const isRunning = currentJob?.status === 'running';
  const isCompleted = currentJob?.status === 'completed';
  const showLogs = currentJob && ['running', 'completed', 'failed'].includes(currentJob.status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Dashboard"
        subtitle="ETL Control Panel"
      />

      <ETLControlPanel
        scripts={scripts || []}
        selectedScriptId={selectedScriptId}
        rowLimit={rowLimit}
        isPreviewLoading={previewJob.isPending}
        isJobLoading={createJob.isPending}
        isJobRunning={isRunning}
        onScriptChange={setSelectedScriptId}
        onRowLimitChange={setRowLimit}
        onPreview={() => handleGetPreview(false)}
        onStartETL={handleStartETL}
      />

      <JobHistoryTable
        jobs={jobHistory as JobHistoryItem[]}
        scripts={scripts || []}
        message={jobHistoryMessage}
        onViewPreview={handleViewHistoryPreview}
      />

      {currentJob && (
        <JobStatusCard
          job={currentJob}
          isCancelLoading={cancelJob.isPending}
          onCancel={handleCancel}
          onViewLogFile={handleViewLogFile}
        />
      )}

      {currentJob && isCompleted && (
        <JobStatisticsCard
          statistics={currentJob}
          onViewLogFile={handleViewLogFile}
        />
      )}

      {showLogs && (
        <LiveLogsPanel
          logs={logs}
          filter={logFilter}
          search={logSearch}
          onFilterChange={setLogFilter}
          onSearchChange={setLogSearch}
          onViewLogFile={handleViewLogFile}
        />
      )}

      {isRunning && processedRows.length > 0 && (
        <ProcessingStatusTable
          rows={processedRows}
          expandedRows={expandedRows}
          onToggleRow={handleToggleRow}
        />
      )}

      <PreviewDialog
        open={previewDialogOpen}
        isForExecution={previewForExecution}
        isLoading={previewJob.isPending}
        loadingMessage={previewLoadingMessage}
        error={previewJob.error?.message}
        data={previewData}
        rowLimit={rowLimit}
        onClose={() => {
          if (!previewJob.isPending) {
            setPreviewDialogOpen(false);
            setPreviewForExecution(false);
            previewJob.reset();
            if (messageIntervalRef.current) {
              clearInterval(messageIntervalRef.current);
              messageIntervalRef.current = null;
            }
          }
        }}
        onConfirmExecute={handleConfirmAndExecuteETL}
      />

      <LogFileViewerDialog
        open={logViewerOpen}
        content={logFileContent}
        isLoading={logFileLoading}
        jobId={currentJob?.id}
        onClose={() => setLogViewerOpen(false)}
      />
    </Box>
  );
}

export default Dashboard;
