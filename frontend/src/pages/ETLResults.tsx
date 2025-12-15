/**
 * ETL Results Page
 * View, filter, and export ETL job results from Snowflake MASTER_PROCESSED_DB
 * Redesigned with modern SaaS component architecture
 */

import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { resultsApi } from '../services/api/results';
import type { ETLJob } from '../services/api/results';

// Layout components
import { PageHeader } from '../components/layout/PageHeader';

// Feature components
import {
  ResultsStatsBar,
  JobsListCard,
  ResultsDataTable,
  type JobItem,
  type ResultRecord,
} from '../components/features/results';

// UI components
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { TableChart } from '@mui/icons-material';

export function ETLResults() {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJobName, setSelectedJobName] = useState('');
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);

  // Fetch jobs list
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['etl-results-jobs'],
    queryFn: () => resultsApi.listJobs(100),
  });

  // Fetch overall statistics
  const { data: stats } = useQuery({
    queryKey: ['etl-results-stats'],
    queryFn: () => resultsApi.getStats(),
  });

  // Fetch results for selected job
  const { data: resultsData, isLoading: isLoadingResults } = useQuery({
    queryKey: ['etl-results', selectedJobId, currentPage, recordsPerPage, excludeLitigators],
    queryFn: () =>
      resultsApi.getJobResults(
        selectedJobId,
        (currentPage - 1) * recordsPerPage,
        recordsPerPage,
        excludeLitigators
      ),
    enabled: !!selectedJobId,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: ({ jobId, exclude }: { jobId: string; exclude: boolean }) =>
      resultsApi.exportJobResults(jobId, exclude),
  });

  const handleJobSelect = (job: JobItem) => {
    setSelectedJobId(job.job_id);
    setSelectedJobName(job.job_name);
    setCurrentPage(1);
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

  // Transform API data to component types
  const jobs: JobItem[] = (jobsData?.jobs || []).map((job: ETLJob) => ({
    job_id: job.job_id,
    job_name: job.job_name,
    record_count: job.record_count,
    litigator_count: job.litigator_count,
    last_processed: job.last_processed,
  }));

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="ETL Results"
        subtitle="View and export processed data from Snowflake"
        actions={
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetchJobs()} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />

      {/* Statistics Bar */}
      {stats && <ResultsStatsBar stats={stats} />}

      {/* Main Content - Jobs List + Results Table */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Jobs List */}
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 380 } }}>
          <JobsListCard
            jobs={jobs}
            selectedJobId={selectedJobId}
            totalJobs={jobsData?.total || 0}
            isLoading={isLoadingJobs}
            onSelectJob={handleJobSelect}
          />
        </Box>

        {/* Results Table */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!selectedJobId ? (
            <EmptyState
              icon={<TableChart sx={{ fontSize: 64 }} />}
              title="Select a Job"
              description="Choose a job from the list to view its results"
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
      </Box>
    </Box>
  );
}

export default ETLResults;
