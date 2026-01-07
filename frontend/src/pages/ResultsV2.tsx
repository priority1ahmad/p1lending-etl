/**
 * ResultsV2 Page
 * Compact results page with simple job list and results table
 * Route: /results-v2
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { CompactJobsList, type CompactJob } from '../components/features/results/CompactJobsList';
import { ResultsDataTable, type ResultRecord } from '../components/features/results/ResultsDataTable';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { resultsApi } from '../services/api/results';
import { textColors } from '../theme';

export function ResultsV2() {
  // State
  const [selectedJob, setSelectedJob] = useState<CompactJob | null>(null);
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch jobs list
  const {
    data: jobsData,
    isLoading: jobsLoading,
  } = useQuery({
    queryKey: ['results-v2-jobs'],
    queryFn: () => resultsApi.listJobs(100),
    staleTime: 30000, // 30 seconds
  });

  // Transform jobs for compact list (remove litigator_count)
  const jobs: CompactJob[] = (jobsData?.jobs || []).map((job) => ({
    job_id: job.job_id,
    job_name: job.job_name,
    record_count: job.record_count,
    last_processed: job.last_processed,
  }));

  // Fetch results for selected job
  const {
    data: resultsData,
    isLoading: resultsLoading,
  } = useQuery({
    queryKey: ['results-v2-data', selectedJob?.job_id, currentPage, recordsPerPage, excludeLitigators],
    queryFn: () =>
      resultsApi.getJobResults(
        selectedJob!.job_id,
        (currentPage - 1) * recordsPerPage,
        recordsPerPage,
        excludeLitigators
      ),
    enabled: !!selectedJob,
    staleTime: 60000, // 1 minute
  });

  // Transform results for table
  const records: ResultRecord[] = (resultsData?.records || []).map((r) => ({
    record_id: r.record_id,
    first_name: r.first_name || '',
    last_name: r.last_name || '',
    address: r.address || '',
    city: r.city || '',
    state: r.state || '',
    zip_code: r.zip_code || '',
    phone_1: r.phone_1,
    email_1: r.email_1,
    in_litigator_list: r.in_litigator_list || 'No',
    processed_at: r.processed_at,
  }));

  // Handlers
  const handleSelectJob = useCallback((job: CompactJob) => {
    setSelectedJob(job);
    setCurrentPage(1); // Reset to first page when changing jobs
  }, []);

  const handleToggleExclude = useCallback((exclude: boolean) => {
    setExcludeLitigators(exclude);
    setCurrentPage(1); // Reset to first page when toggling filter
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRecordsPerPageChange = useCallback((perPage: number) => {
    setRecordsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleExport = useCallback(async () => {
    if (!selectedJob) return;
    setIsExporting(true);
    try {
      await resultsApi.exportJobResults(selectedJob.job_id, excludeLitigators);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedJob, excludeLitigators]);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', p: 3 }}>
      {/* Page Header */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: textColors.primary,
          mb: 3,
        }}
      >
        Results
      </Typography>

      {/* Main Content - Two Column Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          height: 'calc(100% - 48px)',
        }}
      >
        {/* Left Panel - Jobs List (Fixed Width) */}
        <Box sx={{ width: 300, flexShrink: 0 }}>
          <CompactJobsList
            jobs={jobs}
            selectedJobId={selectedJob?.job_id || null}
            isLoading={jobsLoading}
            onSelectJob={handleSelectJob}
          />
        </Box>

        {/* Right Panel - Results Table (Flexible) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {selectedJob ? (
            <ResultsDataTable
              jobName={selectedJob.job_name}
              records={records}
              total={resultsData?.total || 0}
              litigatorCount={resultsData?.litigator_count}
              excludeLitigators={excludeLitigators}
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              isLoading={resultsLoading}
              isExporting={isExporting}
              onImport={() => {}}
              onToggleExclude={handleToggleExclude}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={handleRecordsPerPageChange}
              onExport={handleExport}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                backgroundColor: 'grey.50',
              }}
            >
              <EmptyState
                icon={<TableChart sx={{ fontSize: 64 }} />}
                title="Select a Job"
                description="Choose a job from the list to view its results"
                size="lg"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ResultsV2;
