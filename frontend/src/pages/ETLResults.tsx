/**
 * ETL Results Page
 * Modern dashboard-style results viewer with metrics, charts, and enhanced filtering
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Grid, IconButton, Tooltip, Collapse } from '@mui/material';
import { Refresh, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { resultsApi } from '../services/api/results';
import type { ETLJob } from '../services/api/results';
import { palette } from '../theme';

// Layout components
import { PageHeader } from '../components/layout/PageHeader';

// New feature components
import { ResultsMetricCard } from '../components/features/results/ResultsMetricCard';
import { JobsFilterPanel } from '../components/features/results/JobsFilterPanel';
import type { JobFilters } from '../components/features/results/JobsFilterPanel';
import { QuickStatsWidget } from '../components/features/results/QuickStatsWidget';

// Existing feature components
import {
  JobsListCard,
  ResultsDataTable,
  type JobItem,
  type ResultRecord,
} from '../components/features/results';

// UI components
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { TableChart } from '@mui/icons-material';

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
    refetchInterval: () => {
      if (!selectedJobId) return false;
      const selectedJob = jobsData?.jobs?.find((job: ETLJob) => job.job_id === selectedJobId);
      const isJobRunning = selectedJob?.job_name?.toLowerCase().includes('running') ||
                          selectedJob?.job_name?.toLowerCase().includes('processing');
      return isJobRunning ? 5000 : false;
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: ({ jobId, exclude }: { jobId: string; exclude: boolean }) =>
      resultsApi.exportJobResults(jobId, exclude),
  });

  // Auto-select job from URL query parameter
  useEffect(() => {
    // Only run once on mount and when jobs data changes
    if (hasLoadedFromUrl.current || !jobsData?.jobs) {
      return;
    }

    const jobIdFromUrl = searchParams.get('job_id');
    if (!jobIdFromUrl) {
      hasLoadedFromUrl.current = true;
      return;
    }

    // Find matching job in the jobs list
    const matchingJob = jobsData.jobs.find(
      (job: ETLJob) => job.job_id === jobIdFromUrl
    );

    if (matchingJob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initializing state from URL query parameter is intentional
      setSelectedJobId(jobIdFromUrl);
      setSelectedJobName(matchingJob.job_name || 'ETL Job');
      setCurrentPage(1);
      console.log('[ETLResults] Auto-selected job from URL:', jobIdFromUrl);
    } else {
      console.warn('[ETLResults] Job ID from URL not found in jobs list:', jobIdFromUrl);
    }

    hasLoadedFromUrl.current = true;
  }, [searchParams, jobsData?.jobs]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const token = localStorage.getItem('access_token');

    if (!token) return;

    const socket: Socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[ETLResults] WebSocket connected');
    });

    socket.on('job_complete', (data) => {
      console.log('[ETLResults] Job completed:', data);
      refetchJobs();
      if (selectedJobId === data.job_id) {
        refetchResults();
      }
    });

    socket.on('disconnect', () => {
      console.log('[ETLResults] WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('[ETLResults] WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedJobId, refetchJobs, refetchResults]);

  const handleJobSelect = (job: JobItem) => {
    setSelectedJobId(job.job_id);
    setSelectedJobName(job.job_name);
    setCurrentPage(1);
    // Auto-collapse jobs list on mobile when job selected
    if (window.innerWidth < 900) {
      setJobsListExpanded(false);
    }
  };

  const handleExport = () => {
    if (selectedJobId) {
      exportMutation.mutate({ jobId: selectedJobId, exclude: excludeLitigators });
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

    // Apply search filter
    if (jobFilters.search) {
      filtered = filtered.filter((job) =>
        job.job_name.toLowerCase().includes(jobFilters.search.toLowerCase())
      );
    }

    // Apply sort
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

  // Get selected job for QuickStatsWidget
  const selectedJob = jobs.find((job) => job.job_id === selectedJobId);

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

      {/* Metrics Grid - Compact */}
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

      {/* Two-Column Layout: Jobs List (25%) | Table (75%) */}
      <Grid container spacing={2}>
        {/* Left Column: Jobs List - Collapsible */}
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
              left: 260, // Sidebar width
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
                cleanCount={selectedJob.record_count - selectedJob.litigator_count}
                litigatorCount={selectedJob.litigator_count}
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
                onToggleExclude={handleToggleExclude}
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={handleRecordsPerPageChange}
                onExport={handleExport}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ETLResults;
