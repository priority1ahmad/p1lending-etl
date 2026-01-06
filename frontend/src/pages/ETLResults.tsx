/**
 * ETL Results Page
 * Modern dashboard-style results viewer with metrics, charts, and enhanced filtering
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Grid, IconButton, Tooltip, Collapse } from '@mui/material';
import { Refresh, ChevronLeft, ChevronRight, TableChart } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { resultsApi } from '../services/api/results';
import { lodasoftImportApi } from '../services/api/lodasoftImport';
import type { ImportLogEntry } from '../services/api/lodasoftImport';
import type { ETLJob } from '../services/api/results';
import { palette } from '../theme';

// Layout components
import { PageHeader } from '../components/layout/PageHeader';

// Results components
import { ResultsMetricCard } from '../components/features/results/ResultsMetricCard';
import { JobsFilterPanel } from '../components/features/results/JobsFilterPanel';
import type { JobFilters } from '../components/features/results/JobsFilterPanel';
import { QuickStatsWidget } from '../components/features/results/QuickStatsWidget';
import {
  JobsListCard,
  ResultsDataTable,
  type JobItem,
  type ResultRecord,
} from '../components/features/results';

// Import components
import { ImportDialog, ImportHistoryPanel } from '../components/features/import';
import type { ImportDialogStatus } from '../components/features/import';

// UI components
import { EmptyState } from '../components/ui/Feedback/EmptyState';

export function ETLResults() {
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJobName, setSelectedJobName] = useState('');
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [jobsListExpanded, setJobsListExpanded] = useState(true);
  const [jobsListCollapsed, setJobsListCollapsed] = useState(false);
  const [jobFilters, setJobFilters] = useState<JobFilters>({
    search: '',
    sortBy: 'newest_first',
  });
  const hasLoadedFromUrl = useRef(false);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportDialogStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [recordsImported, setRecordsImported] = useState(0);
  const [recordsFailed, setRecordsFailed] = useState(0);
  const [importError, setImportError] = useState<string | undefined>();
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const [, setCurrentImportId] = useState<string | null>(null);
  const importPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch jobs list
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['etl-results-jobs'],
    queryFn: () => resultsApi.listJobs(100),
    staleTime: 30000,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs || [];
      const hasRunningJobs = jobs.some((job: ETLJob) =>
        job.job_name?.toLowerCase().includes('running') ||
        job.job_name?.toLowerCase().includes('processing')
      );
      return hasRunningJobs ? 5000 : false;
    },
  });

  // Fetch overall statistics
  const { data: stats } = useQuery({
    queryKey: ['etl-results-stats'],
    queryFn: () => resultsApi.getStats(),
  });

  // Fetch results for selected job
  const { data: resultsData, isLoading: isLoadingResults, refetch: refetchResults } = useQuery({
    queryKey: ['etl-results', selectedJobId, currentPage, recordsPerPage, excludeLitigators],
    queryFn: () =>
      resultsApi.getJobResults(
        selectedJobId,
        (currentPage - 1) * recordsPerPage,
        recordsPerPage,
        excludeLitigators
      ),
    enabled: !!selectedJobId,
    staleTime: 30000,
  });

  // Fetch import history
  const {
    data: importHistoryData,
    isLoading: isLoadingImportHistory,
    refetch: refetchImportHistory,
  } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => lodasoftImportApi.getImportHistory(1, 20),
    staleTime: 30000,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: ({ jobId, exclude }: { jobId: string; exclude: boolean }) =>
      resultsApi.exportJobResults(jobId, exclude),
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ jobId, jobName }: { jobId: string; jobName?: string }) =>
      lodasoftImportApi.startImport(jobId, jobName),
    onSuccess: (data) => {
      setCurrentImportId(data.import_id);
      setImportStatus('in_progress');
      startPollingImportStatus(data.import_id);
    },
    onError: (error: Error) => {
      setImportStatus('failed');
      setImportError(error.message);
    },
  });

  const startPollingImportStatus = useCallback((importId: string) => {
    if (importPollRef.current) clearInterval(importPollRef.current);
    
    const pollStatus = async () => {
      try {
        const status = await lodasoftImportApi.getImportStatus(importId);
        setImportProgress(status.progress_percent);
        setRecordsImported(status.successful_records);
        setRecordsFailed(status.failed_records);
        
        // Convert logs
        if (status.logs) {
          const logs: ImportLogEntry[] = status.logs.map((log) => ({
            timestamp: new Date().toISOString(),
            level: 'INFO' as const,
            message: log,
          }));
          setImportLogs(logs);
        }

        if (status.status === 'completed') {
          setImportStatus('completed');
          if (importPollRef.current) {
            clearInterval(importPollRef.current);
            importPollRef.current = null;
          }
          refetchImportHistory();
        } else if (status.status === 'failed') {
          setImportStatus('failed');
          setImportError(status.error_message);
          if (importPollRef.current) {
            clearInterval(importPollRef.current);
            importPollRef.current = null;
          }
          refetchImportHistory();
        }
      } catch (e) {
        console.error('[ETLResults] Error polling import status:', e);
      }
    };
    
    pollStatus();
    importPollRef.current = setInterval(pollStatus, 2000);
  }, [refetchImportHistory]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (importPollRef.current) clearInterval(importPollRef.current);
    };
  }, []);

  // Auto-select job from URL query parameter
  useEffect(() => {
    if (hasLoadedFromUrl.current || !jobsData?.jobs) return;

    const jobIdFromUrl = searchParams.get('job_id');
    if (!jobIdFromUrl) {
      hasLoadedFromUrl.current = true;
      return;
    }

    const matchingJob = jobsData.jobs.find(
      (job: ETLJob) => job.job_id === jobIdFromUrl
    );

    if (matchingJob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedJobId(jobIdFromUrl);
      setSelectedJobName(matchingJob.job_name || 'ETL Job');
      setCurrentPage(1);
    }

    hasLoadedFromUrl.current = true;
  }, [searchParams, jobsData?.jobs]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const token = localStorage.getItem('access_token');

    if (!token) return;

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[ETLResults] WebSocket connected');
    });

    socket.on('job_complete', (data) => {
      refetchJobs();
      if (selectedJobId === data.job_id) {
        refetchResults();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedJobId, refetchJobs, refetchResults]);

  const handleJobSelect = (job: JobItem) => {
    setSelectedJobId(job.job_id);
    setSelectedJobName(job.job_name);
    setCurrentPage(1);
    if (window.innerWidth < 900) {
      setJobsListExpanded(false);
    }
  };

  const handleExport = () => {
    if (selectedJobId) {
      exportMutation.mutate({ jobId: selectedJobId, exclude: excludeLitigators });
    }
  };

  const handleOpenImportDialog = () => {
    setImportStatus('idle');
    setImportProgress(0);
    setRecordsImported(0);
    setRecordsFailed(0);
    setImportError(undefined);
    setImportLogs([]);
    setCurrentImportId(null);
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    if (importPollRef.current) {
      clearInterval(importPollRef.current);
      importPollRef.current = null;
    }
    setImportDialogOpen(false);
  };

  const handleStartImport = () => {
    if (selectedJobId) {
      setImportStatus('loading');
      importMutation.mutate({ jobId: selectedJobId, jobName: selectedJobName });
    }
  };

  const handleToggleExclude = (exclude: boolean) => {
    setExcludeLitigators(exclude);
    setCurrentPage(1);
  };

  const handleRecordsPerPageChange = (perPage: number) => {
    setRecordsPerPage(perPage);
    setCurrentPage(1);
  };

  // Transform and filter jobs
  const jobs: JobItem[] = useMemo(() => {
    const allJobs = (jobsData?.jobs || []).map((job: ETLJob) => ({
      job_id: job.job_id,
      job_name: job.job_name,
      record_count: job.record_count,
      litigator_count: job.litigator_count,
      last_processed: job.last_processed,
    }));

    let filtered = allJobs;

    if (jobFilters.search) {
      filtered = filtered.filter((job) =>
        job.job_name.toLowerCase().includes(jobFilters.search.toLowerCase())
      );
    }

    filtered = filtered.sort((a, b) => {
      switch (jobFilters.sortBy) {
        case 'newest_first':
          return new Date(b.last_processed).getTime() - new Date(a.last_processed).getTime();
        case 'oldest_first':
          return new Date(a.last_processed).getTime() - new Date(b.last_processed).getTime();
        case 'most_records':
          return b.record_count - a.record_count;
        case 'most_litigators':
          return b.litigator_count - a.litigator_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobsData?.jobs, jobFilters]);

  // Transform records
  const records: ResultRecord[] = (resultsData?.records || []).map((record: any) => ({
    record_id: record.record_id,
    first_name: record.first_name,
    last_name: record.last_name,
    address: record.address,
    city: record.city,
    state: record.state,
    zip_code: record.zip_code,
    phone_1: record.phone_1,
    email_1: record.email_1,
    in_litigator_list: record.in_litigator_list,
    processed_at: record.processed_at,
  }));

  const selectedJob = jobs.find((job) => job.job_id === selectedJobId);
  const importHistory = importHistoryData?.imports || [];
  const isImporting = importMutation.isPending || importStatus === 'in_progress';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader
        title="ETL Results"
        subtitle="Dashboard analytics and data export"
        actions={
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetchJobs()} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />

      {/* Metrics Grid */}
      {stats && (
        <Grid container spacing={1.5}>
          {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
          <Grid item xs={6} sm={6} md={3}>
            <ResultsMetricCard
              title="Total Jobs"
              value={stats.total_jobs}
              color={palette.primary[800]}
            />
          </Grid>
          {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
          <Grid item xs={6} sm={6} md={3}>
            <ResultsMetricCard
              title="Total Records"
              value={stats.total_records}
              color={palette.accent[500]}
            />
          </Grid>
          {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
          <Grid item xs={6} sm={6} md={3}>
            <ResultsMetricCard
              title="Clean Records"
              value={stats.clean_records}
              color={palette.success[500]}
            />
          </Grid>
          {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
          <Grid item xs={6} sm={6} md={3}>
            <ResultsMetricCard
              title="Litigators"
              value={stats.total_litigators}
              color={palette.warning[500]}
              suffix={`(${stats.litigator_percentage}%)`}
            />
          </Grid>
        </Grid>
      )}

      {/* Two-Column Layout */}
      <Grid container spacing={2}>
        {/* Left Column: Jobs List */}
        {!jobsListCollapsed && (
          /* @ts-expect-error - MUI v7 Grid item prop works at runtime */
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip title="Collapse jobs list">
                  <IconButton
                    onClick={() => setJobsListCollapsed(true)}
                    size="small"
                    sx={{ ml: 'auto' }}
                  >
                    <ChevronLeft />
                  </IconButton>
                </Tooltip>
              </Box>
              <JobsFilterPanel
                currentFilters={jobFilters}
                onFilterChange={setJobFilters}
              />
              <Collapse in={jobsListExpanded}>
                <JobsListCard
                  jobs={jobs}
                  selectedJobId={selectedJobId}
                  totalJobs={jobs.length}
                  isLoading={isLoadingJobs}
                  onSelectJob={handleJobSelect}
                />
              </Collapse>
            </Box>
          </Grid>
        )}

        {/* Expand Button (when collapsed) */}
        {jobsListCollapsed && (
          <Box
            sx={{
              position: 'fixed',
              left: 260,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
            }}
          >
            <Tooltip title="Expand jobs list">
              <IconButton
                onClick={() => setJobsListCollapsed(false)}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Right Column: Table */}
        {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
        <Grid item xs={12} md={jobsListCollapsed ? 12 : 9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Quick Stats for Selected Job */}
            {selectedJob && (
              <QuickStatsWidget
                recordCount={selectedJob.record_count}
                cleanCount={selectedJob.record_count - selectedJob.litigator_count - (selectedJob.dnc_count || 0) + (selectedJob.both_count || 0)}
                litigatorCount={selectedJob.litigator_count}
                dncCount={selectedJob.dnc_count || 0}
              />
            )}

            {/* Results Table */}
            {!selectedJobId ? (
              <EmptyState
                icon={<TableChart sx={{ fontSize: 64 }} />}
                title="Select a Job"
                description="Choose a job from the filtered list to view its results"
                size="lg"
              />
            ) : (
              <ResultsDataTable
                jobName={selectedJobName}
                records={records}
                total={resultsData?.total || 0}
                litigatorCount={resultsData?.litigator_count}
                excludeLitigators={excludeLitigators}
                currentPage={currentPage}
                recordsPerPage={recordsPerPage}
                isLoading={isLoadingResults}
                isExporting={exportMutation.isPending}
                isImporting={isImporting}
                onToggleExclude={handleToggleExclude}
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={handleRecordsPerPageChange}
                onExport={handleExport}
                onImport={handleOpenImportDialog}
              />
            )}

            {/* Import History */}
            {selectedJobId && (
              <ImportHistoryPanel
                imports={importHistory}
                isLoading={isLoadingImportHistory}
                onRefresh={() => refetchImportHistory()}
              />
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        jobName={selectedJobName}
        recordCount={resultsData?.total || 0}
        status={importStatus}
        progress={importProgress}
        recordsImported={recordsImported}
        recordsFailed={recordsFailed}
        errorMessage={importError}
        logs={importLogs}
        onClose={handleCloseImportDialog}
        onStartImport={handleStartImport}
      />
    </Box>
  );
}

export default ETLResults;
