/**
 * ResultsPageV3 Page
 * Airtable-inspired results page with collapsible sidebar
 * Route: /results-v3
 */

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { JobSidebar, type SidebarJob } from '../components/features/results/JobSidebar';
import { ResultsHeader } from '../components/features/results/ResultsHeader';
import { AirtableTable, type TableRecord } from '../components/features/results/AirtableTable';
import { TableFooter } from '../components/features/results/TableFooter';
import { ImportDialog } from '../components/features/import';
import type { ImportDialogStatus } from '../components/features/import';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { resultsApi } from '../services/api/results';
import { lodasoftImportApi, type ImportLogEntry } from '../services/api/lodasoftImport';
import { textColors } from '../theme';

const RECORDS_PER_PAGE = 100;

export function ResultsPageV3() {
  // State
  const [selectedJob, setSelectedJob] = useState<SidebarJob | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Import state
  const [importStatus, setImportStatus] = useState<ImportDialogStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [recordsImported, setRecordsImported] = useState(0);
  const [recordsFailed, setRecordsFailed] = useState(0);
  const [importError, setImportError] = useState<string | undefined>();
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const importPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Transform results for table - pass all fields from API
  const records: TableRecord[] = (resultsData?.records || []).map((r) => ({
    // Metadata
    record_id: r.record_id,
    job_name: r.job_name,
    table_id: r.table_id,
    table_title: r.table_title,
    processed_at: r.processed_at,

    // Lead Information
    lead_number: r.lead_number,
    campaign_date: r.campaign_date,
    lead_campaign: r.lead_campaign,
    lead_source: r.lead_source,
    ref_id: r.ref_id,

    // Person Data
    first_name: r.first_name,
    last_name: r.last_name,
    co_borrower_full_name: r.co_borrower_full_name,
    address: r.address,
    city: r.city,
    state: r.state,
    zip_code: r.zip_code,

    // Property Data
    total_units: r.total_units,
    owner_occupied: r.owner_occupied,
    annual_tax_amount: r.annual_tax_amount,
    assessed_value: r.assessed_value,
    estimated_value: r.estimated_value,

    // First Mortgage
    ltv: r.ltv,
    loan_type: r.loan_type,
    first_mortgage_type: r.first_mortgage_type,
    first_mortgage_amount: r.first_mortgage_amount,
    first_mortgage_balance: r.first_mortgage_balance,
    term: r.term,
    estimated_new_payment: r.estimated_new_payment,

    // Second Mortgage
    second_mortgage_type: r.second_mortgage_type,
    second_mortgage_term: r.second_mortgage_term,
    second_mortgage_balance: r.second_mortgage_balance,
    has_second_mortgage: r.has_second_mortgage,

    // Current Loan Details
    current_interest_rate: r.current_interest_rate,
    current_lender: r.current_lender,
    arm_index_type: r.arm_index_type,
    origination_date: r.origination_date,
    rate_adjustment_date: r.rate_adjustment_date,

    // Contact Info
    phone_1: r.phone_1,
    phone_2: r.phone_2,
    phone_3: r.phone_3,
    email_1: r.email_1,
    email_2: r.email_2,
    email_3: r.email_3,

    // Compliance Flags
    in_litigator_list: r.in_litigator_list,
    phone_1_in_dnc: r.phone_1_in_dnc,
    phone_2_in_dnc: r.phone_2_in_dnc,
    phone_3_in_dnc: r.phone_3_in_dnc,
  }));

  // Get litigator count from job data or results
  const litigatorCount =
    (jobsData?.jobs?.find((j) => j.job_id === selectedJob?.job_id) as { litigator_count?: number } | undefined)
      ?.litigator_count || resultsData?.litigator_count || 0;

  // Start polling for import status
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
        } else if (status.status === 'failed') {
          setImportStatus('failed');
          setImportError(status.error_message);
          if (importPollRef.current) {
            clearInterval(importPollRef.current);
            importPollRef.current = null;
          }
        }
      } catch (e) {
        console.error('[ResultsPageV3] Error polling import status:', e);
      }
    };
    
    pollStatus();
    importPollRef.current = setInterval(pollStatus, 2000);
  }, []);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ jobId, jobName }: { jobId: string; jobName?: string }) =>
      lodasoftImportApi.startImport(jobId, jobName),
    onSuccess: (data) => {
      setImportStatus('in_progress');
      startPollingImportStatus(data.import_id);
    },
    onError: (error: Error) => {
      setImportStatus('failed');
      setImportError(error.message);
    },
  });

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

  const handleImport = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleCloseImportDialog = useCallback(() => {
    // Only reset state if import is not in progress
    if (importStatus !== 'in_progress' && importStatus !== 'loading') {
      setImportStatus('idle');
      setImportProgress(0);
      setRecordsImported(0);
      setRecordsFailed(0);
      setImportError(undefined);
      setImportLogs([]);
    }
    setIsImportDialogOpen(false);
  }, [importStatus]);

  const handleStartImport = useCallback(() => {
    if (!selectedJob) return;
    setImportStatus('loading');
    importMutation.mutate({
      jobId: selectedJob.job_id,
      jobName: selectedJob.job_name,
    });
  }, [selectedJob, importMutation]);

  const isImporting = importMutation.isPending || importStatus === 'in_progress';

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
                isImporting={isImporting}
                onExport={handleExport}
                onImport={handleImport}
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

      {/* Import Dialog */}
      <ImportDialog
        open={isImportDialogOpen}
        jobName={selectedJob?.job_name || ''}
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

export default ResultsPageV3;
