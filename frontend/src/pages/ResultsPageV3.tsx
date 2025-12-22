/**
 * ResultsPageV3 Page
 * Airtable-inspired results page with collapsible sidebar
 * Route: /results-v3
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { JobSidebar, type SidebarJob } from '../components/features/results/JobSidebar';
import { ResultsHeader } from '../components/features/results/ResultsHeader';
import { AirtableTable, type TableRecord } from '../components/features/results/AirtableTable';
import { TableFooter } from '../components/features/results/TableFooter';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { resultsApi } from '../services/api/results';
import { textColors } from '../theme';

const RECORDS_PER_PAGE = 100;

export function ResultsPageV3() {
  // State
  const [selectedJob, setSelectedJob] = useState<SidebarJob | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch jobs list
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['results-v3-jobs'],
    queryFn: () => resultsApi.listJobs(100),
    staleTime: 30000,
  });

  // Transform jobs for sidebar
  const jobs: SidebarJob[] = (jobsData?.jobs || []).map((job) => ({
    job_id: job.job_id,
    job_name: job.job_name,
    record_count: job.record_count,
    last_processed: job.last_processed,
  }));

  // Fetch results for selected job
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['results-v3-data', selectedJob?.job_id, currentPage, excludeLitigators],
    queryFn: () =>
      resultsApi.getJobResults(
        selectedJob!.job_id,
        (currentPage - 1) * RECORDS_PER_PAGE,
        RECORDS_PER_PAGE,
        excludeLitigators
      ),
    enabled: !!selectedJob,
    staleTime: 60000,
  });

  // Transform results for table
  const records: TableRecord[] = (resultsData?.records || []).map((r) => ({
    record_id: r.record_id,
    first_name: r.first_name,
    last_name: r.last_name,
    address: r.address,
    city: r.city,
    state: r.state,
    zip_code: r.zip_code,
    phone_1: r.phone_1,
    phone_2: r.phone_2,
    phone_3: r.phone_3,
    email_1: r.email_1,
    email_2: r.email_2,
    email_3: r.email_3,
    in_litigator_list: r.in_litigator_list,
    processed_at: r.processed_at,
  }));

  // Get litigator count from job data or results
  const litigatorCount =
    (jobsData?.jobs?.find((j) => j.job_id === selectedJob?.job_id) as { litigator_count?: number } | undefined)
      ?.litigator_count || resultsData?.litigator_count || 0;

  // Handlers
  const handleSelectJob = useCallback((job: SidebarJob) => {
    setSelectedJob(job);
    setCurrentPage(1);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleToggleExclude = useCallback((exclude: boolean) => {
    setExcludeLitigators(exclude);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
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
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Page Title Bar */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
            fontSize: '1.25rem',
          }}
        >
          Results
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
        {/* Sidebar */}
        <JobSidebar
          jobs={jobs}
          selectedJobId={selectedJob?.job_id || null}
          isLoading={jobsLoading}
          isCollapsed={isSidebarCollapsed}
          onSelectJob={handleSelectJob}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main Panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {selectedJob ? (
            <>
              {/* Header */}
              <ResultsHeader
                jobName={selectedJob.job_name}
                recordCount={resultsData?.total || selectedJob.record_count}
                litigatorCount={litigatorCount}
                processedDate={selectedJob.last_processed}
                isExporting={isExporting}
                onExport={handleExport}
              />

              {/* Table */}
              <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <AirtableTable records={records} isLoading={resultsLoading} />
              </Box>

              {/* Footer */}
              <TableFooter
                total={resultsData?.total || 0}
                currentPage={currentPage}
                recordsPerPage={RECORDS_PER_PAGE}
                excludeLitigators={excludeLitigators}
                onPageChange={handlePageChange}
                onToggleExclude={handleToggleExclude}
              />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
              }}
            >
              <EmptyState
                icon={<TableChart sx={{ fontSize: 72, color: '#d1d5db' }} />}
                title="Select a Job"
                description="Choose a job from the sidebar to view its results"
                size="lg"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ResultsPageV3;
