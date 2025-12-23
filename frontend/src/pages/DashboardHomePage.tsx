/**
 * DashboardHomePage - Container component
 * Connects the DashboardHome prototype to real API data and WebSocket events
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { io, Socket } from 'socket.io-client';

import {
  DashboardHome,
  PreviewDialogCompact,
  type DashboardStats,
  type ActiveJob,
  type Script,
  type JobHistoryItem,
  type ActivityItem,
  type ActivityType,
  type PreviewStats,
} from '../components/features/home';
import { scriptsApi, type SQLScript } from '../services/api/scripts';
import { jobsApi, type ETLJob, type JobCreate, type JobPreview } from '../services/api/jobs';
import type {
  JobProgressData,
  BatchProgressData,
  RowProcessedData,
  JobLogData,
  JobCompleteData,
  JobErrorData,
} from '../types/socket';

// Helper to generate unique IDs for activity items
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to check if a date is today
function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper to format elapsed time from seconds
function formatElapsedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Convert API SQLScript to component Script
function toScript(script: SQLScript): Script {
  return {
    id: script.id,
    name: script.name,
    description: script.description,
  };
}

// Convert API ETLJob to component JobHistoryItem
function toJobHistoryItem(job: ETLJob, scriptName?: string): JobHistoryItem {
  // Map API job_type to component job_type
  let jobType: 'preview' | 'single_script' | 'combined_scripts' = 'single_script';
  if (job.job_type === 'preview') jobType = 'preview';
  else if (job.job_type === 'all_scripts') jobType = 'combined_scripts';
  else if (job.job_type === 'single_script') jobType = 'single_script';

  return {
    id: job.id,
    job_type: jobType,
    script_name: scriptName || job.preview_data?.script_name || 'Unknown Script',
    status: job.status,
    total_rows_processed: job.total_rows_processed,
    row_limit: job.row_limit,
    litigator_count: job.litigator_count,
    dnc_count: job.dnc_count,
    clean_count: job.clean_count,
    started_at: job.started_at,
    completed_at: job.completed_at,
    duration: job.started_at && job.completed_at
      ? Math.floor((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
      : undefined,
  };
}

// Convert API ETLJob to component ActiveJob
function toActiveJob(job: ETLJob, scriptName?: string): ActiveJob {
  const elapsedTime = job.started_at
    ? Math.floor((Date.now() - new Date(job.started_at).getTime()) / 1000)
    : undefined;

  return {
    id: job.id,
    scriptName: scriptName || job.preview_data?.script_name || 'Processing...',
    progress: job.progress || 0,
    currentRow: job.current_row,
    totalRows: job.total_rows,
    currentBatch: job.current_batch,
    totalBatches: job.total_batches,
    message: job.message,
    elapsedTime,
    timeRemaining: job.rows_remaining && job.current_row && elapsedTime && job.current_row > 0
      ? formatElapsedTime(Math.floor((job.rows_remaining / job.current_row) * elapsedTime))
      : undefined,
    stats: {
      clean: job.clean_count || 0,
      litigator: job.litigator_count || 0,
      dnc: job.dnc_count || 0,
    },
  };
}

// Convert JobPreview to PreviewStats
function toPreviewStats(preview: JobPreview): PreviewStats {
  return {
    scriptName: preview.script_name,
    totalRows: preview.total_rows ?? preview.row_count,
    alreadyProcessed: preview.already_processed ?? 0,
    unprocessed: preview.unprocessed ?? preview.row_count,
    sampleRows: preview.rows,
  };
}

// Map log level to activity type
function logLevelToActivityType(level?: string): ActivityType {
  const levelLower = level?.toLowerCase() || 'info';
  if (levelLower.includes('error')) return 'error';
  if (levelLower.includes('warn')) return 'warning';
  if (levelLower.includes('success') || levelLower.includes('complete')) return 'success';
  if (levelLower.includes('snowflake')) return 'snowflake';
  if (levelLower.includes('idicore')) return 'idicore';
  if (levelLower.includes('ccc') || levelLower.includes('litigator')) return 'ccc';
  if (levelLower.includes('dnc')) return 'dnc';
  if (levelLower.includes('batch')) return 'batch';
  return 'info';
}

export function DashboardHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const socketRef = useRef<Socket | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI State
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [rowLimit, setRowLimit] = useState<string>('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Preview Dialog State
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewForExecution, setPreviewForExecution] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewStats | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ===== API Queries =====

  // Fetch scripts
  const { data: scriptsData, isLoading: scriptsLoading } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list(),
  });

  // Fetch latest job (for active job detection)
  const { data: latestJob, refetch: refetchLatestJob } = useQuery({
    queryKey: ['jobs', 'latest'],
    queryFn: async () => {
      const response = await jobsApi.list(0, 1);
      return response.jobs.length > 0 ? response.jobs[0] : null;
    },
    refetchInterval: (query) => {
      const job = query.state.data as ETLJob | null;
      return job?.status === 'running' ? 2000 : 10000;
    },
  });

  // Fetch job history
  const { data: jobHistoryResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['jobs', 'history'],
    queryFn: () => jobsApi.list(0, 50),
    refetchInterval: 10000,
  });

  // ===== API Mutations =====

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const rowLimitNum = rowLimit ? parseInt(rowLimit, 10) : undefined;
      return jobsApi.preview([scriptId], rowLimitNum);
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        setPreviewData(toPreviewStats(data[0]));
        setPreviewError(null);
      }
    },
    onError: (error: Error) => {
      setPreviewError(error.message || 'Failed to load preview');
      setPreviewData(null);
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: JobCreate) => jobsApi.create(data),
    onSuccess: (job) => {
      enqueueSnackbar(`ETL job started: ${job.id}`, { variant: 'success' });
      setPreviewDialogOpen(false);
      setPreviewData(null);
      setActivities([]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      // Add start activity
      setActivities((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'start',
          message: 'ETL job started',
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Failed to start job: ${error.message}`, { variant: 'error' });
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.cancel(jobId),
    onSuccess: () => {
      enqueueSnackbar('Job cancellation requested', { variant: 'info' });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Failed to cancel job: ${error.message}`, { variant: 'error' });
    },
  });

  // ===== Computed Values =====

  const scripts: Script[] = scriptsData?.map(toScript) || [];
  const selectedScript = scriptsData?.find((s) => s.id === selectedScriptId);
  const isJobRunning = latestJob?.status === 'running';

  // Build job history with script names
  const jobHistory: JobHistoryItem[] = (jobHistoryResponse?.jobs || []).map((job) => {
    const script = scriptsData?.find((s) => s.id === job.script_id);
    return toJobHistoryItem(job, script?.name);
  });

  // Build active job
  const activeJob: ActiveJob | undefined = isJobRunning && latestJob
    ? {
        ...toActiveJob(latestJob, selectedScript?.name),
        elapsedTime, // Use timer-updated elapsed time
      }
    : undefined;

  // Calculate stats from recent jobs
  const stats: DashboardStats = {
    totalProcessed: latestJob?.total_rows_processed || 0,
    totalClean: latestJob?.clean_count || 0,
    totalLitigator: latestJob?.litigator_count || 0,
    totalDnc: latestJob?.dnc_count || 0,
    jobsToday: jobHistory.filter((j) => isToday(j.started_at)).length,
  };

  // ===== Event Handlers =====

  const handlePreview = useCallback(() => {
    if (!selectedScriptId) {
      enqueueSnackbar('Please select a script first', { variant: 'warning' });
      return;
    }
    setPreviewForExecution(false);
    setPreviewDialogOpen(true);
    setPreviewError(null);
    previewMutation.mutate(selectedScriptId);
  }, [selectedScriptId, previewMutation, enqueueSnackbar]);

  const handleStartETL = useCallback(() => {
    if (!selectedScriptId) {
      enqueueSnackbar('Please select a script first', { variant: 'warning' });
      return;
    }
    // Show preview dialog with execution mode
    setPreviewForExecution(true);
    setPreviewDialogOpen(true);
    setPreviewError(null);
    previewMutation.mutate(selectedScriptId);
  }, [selectedScriptId, previewMutation, enqueueSnackbar]);

  const handleExecuteJob = useCallback(() => {
    if (!selectedScriptId) return;

    createJobMutation.mutate({
      script_id: selectedScriptId,
      job_type: 'single_script',
      row_limit: rowLimit ? parseInt(rowLimit, 10) : undefined,
    });
  }, [selectedScriptId, rowLimit, createJobMutation]);

  const handleStopJob = useCallback(() => {
    if (latestJob?.id) {
      cancelJobMutation.mutate(latestJob.id);
    }
  }, [latestJob, cancelJobMutation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['scripts'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    enqueueSnackbar('Data refreshed', { variant: 'info' });
  }, [queryClient, enqueueSnackbar]);

  const handleViewResults = useCallback(
    (jobId: string) => {
      navigate(`/results?job_id=${jobId}`);
    },
    [navigate]
  );

  const handleViewAllHistory = useCallback(() => {
    navigate('/results');
  }, [navigate]);

  const handleViewPreview = useCallback(
    (jobId: string) => {
      navigate(`/results?job_id=${jobId}`);
    },
    [navigate]
  );

  // ===== WebSocket Connection =====

  useEffect(() => {
    if (!isJobRunning || !latestJob?.id) {
      // Clean up socket when job stops
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No auth token for WebSocket');
      return;
    }

    // In production, use relative URL for nginx proxy; in dev, use localhost
    const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : undefined);

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('join_job', { job_id: latestJob.id });

      // Add connection activity
      setActivities((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'info',
          message: 'Connected to job updates',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket error:', error.message);
    });

    socket.on('job_progress', (data: JobProgressData) => {
      // Update job data via refetch
      refetchLatestJob();

      // Add batch progress activity
      if (data.current_batch && data.total_batches) {
        setActivities((prev) => {
          // Limit to last 100 activities
          const updated = [
            ...prev.slice(-99),
            {
              id: generateId(),
              type: 'batch' as ActivityType,
              message: `Batch ${data.current_batch}/${data.total_batches}`,
              timestamp: new Date().toISOString(),
              details: data.message,
            },
          ];
          return updated;
        });
      }
    });

    socket.on('batch_progress', (data: BatchProgressData) => {
      setActivities((prev) => [
        ...prev.slice(-99),
        {
          id: generateId(),
          type: 'batch',
          message: `Processing batch ${data.current_batch}/${data.total_batches}`,
          timestamp: new Date().toISOString(),
          details: data.message,
        },
      ]);
    });

    socket.on('row_processed', (data: RowProcessedData) => {
      if (data.row_data) {
        const status = data.row_data.status || 'processed';
        let activityType: ActivityType = 'success';

        if (data.row_data.in_litigator_list === 'Yes') {
          activityType = 'ccc';
        } else if (
          data.row_data.phone_1_in_dnc === 'Yes' ||
          data.row_data.phone_2_in_dnc === 'Yes' ||
          data.row_data.phone_3_in_dnc === 'Yes'
        ) {
          activityType = 'dnc';
        }

        setActivities((prev) => [
          ...prev.slice(-99),
          {
            id: generateId(),
            type: activityType,
            message: `Row ${data.row_data?.row_number || ''}: ${data.row_data?.first_name || ''} ${data.row_data?.last_name || ''}`,
            timestamp: new Date().toISOString(),
            details: status,
          },
        ]);
      }
    });

    socket.on('job_log', (data: JobLogData) => {
      setActivities((prev) => [
        ...prev.slice(-99),
        {
          id: generateId(),
          type: logLevelToActivityType(data.level),
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    });

    socket.on('job_complete', (_data: JobCompleteData) => {
      setActivities((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'success',
          message: 'Job completed successfully',
          timestamp: new Date().toISOString(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      enqueueSnackbar('ETL job completed!', { variant: 'success' });
    });

    socket.on('job_error', (data: JobErrorData) => {
      setActivities((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'error',
          message: `Job failed: ${data.error}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      enqueueSnackbar(`ETL job failed: ${data.error}`, { variant: 'error' });
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave_job', { job_id: latestJob.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isJobRunning, latestJob?.id, queryClient, refetchLatestJob, enqueueSnackbar]);

  // ===== Elapsed Time Timer =====

  useEffect(() => {
    if (isJobRunning && latestJob?.started_at) {
      const startTime = new Date(latestJob.started_at).getTime();

      // Calculate elapsed time - called by interval
      const updateElapsed = () => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      };

      // Start interval that updates every second
      // Use queueMicrotask for initial update to avoid synchronous setState in effect
      queueMicrotask(updateElapsed);
      elapsedTimerRef.current = setInterval(updateElapsed, 1000);

      return () => {
        if (elapsedTimerRef.current) {
          clearInterval(elapsedTimerRef.current);
          elapsedTimerRef.current = null;
        }
      };
    }
    // Reset elapsed time when job stops - use ref to avoid cascading render
    return () => {
      setElapsedTime(0);
    };
  }, [isJobRunning, latestJob?.started_at]);

  // ===== Render =====

  return (
    <>
      <DashboardHome
        stats={stats}
        scripts={scripts}
        jobHistory={jobHistory}
        activeJob={activeJob}
        activities={activities}
        selectedScriptId={selectedScriptId}
        rowLimit={rowLimit}
        isLoading={scriptsLoading || historyLoading}
        isPreviewLoading={previewMutation.isPending}
        isJobLoading={createJobMutation.isPending}
        isJobStopping={cancelJobMutation.isPending}
        onScriptChange={setSelectedScriptId}
        onRowLimitChange={setRowLimit}
        onPreview={handlePreview}
        onStartETL={handleStartETL}
        onStopJob={handleStopJob}
        onRefresh={handleRefresh}
        onViewResults={handleViewResults}
        onViewPreview={handleViewPreview}
        onViewAllHistory={handleViewAllHistory}
      />

      <PreviewDialogCompact
        open={previewDialogOpen}
        isForExecution={previewForExecution}
        isLoading={previewMutation.isPending}
        loadingMessage={previewForExecution ? 'Preparing job...' : 'Loading preview...'}
        error={previewError || undefined}
        data={previewData || undefined}
        rowLimit={rowLimit ? parseInt(rowLimit, 10) : undefined}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewData(null);
          setPreviewError(null);
        }}
        onExecute={handleExecuteJob}
      />
    </>
  );
}

export default DashboardHomePage;
