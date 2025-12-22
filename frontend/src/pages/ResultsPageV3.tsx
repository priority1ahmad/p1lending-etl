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

// Use mock data when API is unavailable (development mode)
const USE_MOCK_DATA = true;

// Mock jobs data
const MOCK_JOBS: SidebarJob[] = [
  { job_id: '1', job_name: 'CA_Foreclosure_Q4_2024', record_count: 15420, last_processed: '2024-12-22T10:30:00Z' },
  { job_id: '2', job_name: 'TX_Refinance_Dec_2024', record_count: 8750, last_processed: '2024-12-21T15:45:00Z' },
  { job_id: '3', job_name: 'FL_Purchase_Winter_2024', record_count: 12300, last_processed: '2024-12-20T09:15:00Z' },
  { job_id: '4', job_name: 'NY_HELOC_Nov_2024', record_count: 5680, last_processed: '2024-12-19T14:00:00Z' },
  { job_id: '5', job_name: 'AZ_Investment_Properties', record_count: 3200, last_processed: '2024-12-18T11:30:00Z' },
  { job_id: '6', job_name: 'WA_Seattle_Metro_Leads', record_count: 9870, last_processed: '2024-12-17T09:00:00Z' },
  { job_id: '7', job_name: 'CO_Denver_Refi_Q4', record_count: 4560, last_processed: '2024-12-16T14:30:00Z' },
  { job_id: '8', job_name: 'GA_Atlanta_Purchase', record_count: 7890, last_processed: '2024-12-15T11:15:00Z' },
];

// Mock litigator counts per job
const MOCK_LITIGATOR_COUNTS: Record<string, number> = {
  '1': 342,
  '2': 198,
  '3': 276,
  '4': 89,
  '5': 45,
  '6': 234,
  '7': 67,
  '8': 156,
};

// Generate mock records for a job
const generateMockRecords = (jobId: string, offset: number, limit: number): TableRecord[] => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm Way', 'Park Blvd', 'Lake Dr'];
  const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Phoenix', 'Chicago', 'Seattle', 'Denver', 'Atlanta', 'Boston'];
  const states = ['CA', 'TX', 'FL', 'NY', 'AZ', 'IL', 'WA', 'CO', 'GA', 'MA'];

  return Array.from({ length: limit }, (_, i) => {
    const idx = offset + i;
    const seed = parseInt(jobId) * 1000 + idx;
    return {
      record_id: `${jobId}-record-${idx + 1}`,
      first_name: firstNames[seed % firstNames.length],
      last_name: lastNames[(seed + 3) % lastNames.length],
      address: `${100 + (seed % 900) * 10} ${streets[seed % streets.length]}`,
      city: cities[seed % cities.length],
      state: states[seed % states.length],
      zip_code: `${90000 + (seed % 10000)}`,
      phone_1: `(${500 + (seed % 500)}) ${100 + (seed % 900)}-${1000 + (seed % 9000)}`,
      phone_2: idx % 3 === 0 ? `(${500 + ((seed + 1) % 500)}) ${100 + ((seed + 1) % 900)}-${1000 + ((seed + 1) % 9000)}` : undefined,
      phone_3: idx % 7 === 0 ? `(${500 + ((seed + 2) % 500)}) ${100 + ((seed + 2) % 900)}-${1000 + ((seed + 2) % 9000)}` : undefined,
      email_1: `${firstNames[seed % firstNames.length].toLowerCase()}${idx + 1}@email.com`,
      email_2: idx % 2 === 0 ? `${lastNames[(seed + 3) % lastNames.length].toLowerCase()}.work@company.com` : undefined,
      email_3: undefined,
      in_litigator_list: idx % 15 === 0 ? 'Yes' : 'No',
      processed_at: new Date(Date.now() - idx * 60 * 1000).toISOString(),
    };
  });
};

export function ResultsPageV3() {
  // State
  const [selectedJob, setSelectedJob] = useState<SidebarJob | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch jobs list (or use mock data)
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['results-v3-jobs'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { jobs: MOCK_JOBS, total: MOCK_JOBS.length, message: 'Mock data' };
      }
      return resultsApi.listJobs(100);
    },
    staleTime: 30000,
  });

  // Transform jobs for sidebar
  const jobs: SidebarJob[] = (jobsData?.jobs || []).map((job) => ({
    job_id: job.job_id,
    job_name: job.job_name,
    record_count: job.record_count,
    last_processed: job.last_processed,
  }));

  // Fetch results for selected job (or use mock data)
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['results-v3-data', selectedJob?.job_id, currentPage, excludeLitigators],
    queryFn: async () => {
      if (USE_MOCK_DATA && selectedJob) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        const job = MOCK_JOBS.find((j) => j.job_id === selectedJob.job_id);
        const total = job?.record_count || 0;
        const litigatorCount = MOCK_LITIGATOR_COUNTS[selectedJob.job_id] || 0;
        let records = generateMockRecords(
          selectedJob.job_id,
          (currentPage - 1) * RECORDS_PER_PAGE,
          Math.min(RECORDS_PER_PAGE, total - (currentPage - 1) * RECORDS_PER_PAGE)
        );
        // Filter out litigators if requested
        if (excludeLitigators) {
          records = records.filter((r) => r.in_litigator_list !== 'Yes');
        }
        return {
          records,
          total: excludeLitigators ? total - litigatorCount : total,
          offset: (currentPage - 1) * RECORDS_PER_PAGE,
          limit: RECORDS_PER_PAGE,
          litigator_count: litigatorCount,
        };
      }
      return resultsApi.getJobResults(
        selectedJob!.job_id,
        (currentPage - 1) * RECORDS_PER_PAGE,
        RECORDS_PER_PAGE,
        excludeLitigators
      );
    },
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

  // Get litigator count
  const litigatorCount = USE_MOCK_DATA && selectedJob
    ? MOCK_LITIGATOR_COUNTS[selectedJob.job_id] || 0
    : (jobsData?.jobs?.find((j: { job_id: string; litigator_count?: number }) => j.job_id === selectedJob?.job_id) as { litigator_count?: number } | undefined)?.litigator_count || resultsData?.litigator_count || 0;

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
      if (USE_MOCK_DATA) {
        // Simulate export with mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const job = MOCK_JOBS.find((j) => j.job_id === selectedJob.job_id);
        const allRecords = generateMockRecords(selectedJob.job_id, 0, job?.record_count || 100);
        const filteredRecords = excludeLitigators
          ? allRecords.filter((r) => r.in_litigator_list !== 'Yes')
          : allRecords;

        // Create CSV content
        const headers = ['Name', 'Address', 'City', 'State', 'Zip', 'Phone 1', 'Phone 2', 'Phone 3', 'Email 1', 'Email 2', 'Litigator', 'Processed'];
        const rows = filteredRecords.map((r) => [
          `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          r.address || '',
          r.city || '',
          r.state || '',
          r.zip_code || '',
          r.phone_1 || '',
          r.phone_2 || '',
          r.phone_3 || '',
          r.email_1 || '',
          r.email_2 || '',
          r.in_litigator_list || 'No',
          r.processed_at,
        ]);
        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedJob.job_name}_export.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        await resultsApi.exportJobResults(selectedJob.job_id, excludeLitigators);
      }
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
