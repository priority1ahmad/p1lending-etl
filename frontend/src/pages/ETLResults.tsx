/**
 * ETL Results Page
 *
 * View, filter, and export ETL job results from Snowflake MASTER_PROCESSED_DB
 */

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { resultsApi } from '../services/api/results';
import type { ETLJob, ETLResultRecord } from '../services/api/results';

export const ETLResults: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedJobName, setSelectedJobName] = useState<string>('');
  const [excludeLitigators, setExcludeLitigators] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(100);

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
  const {
    data: resultsData,
    isLoading: isLoadingResults,
  } = useQuery({
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

  const handleJobSelect = (job: ETLJob) => {
    setSelectedJobId(job.job_id);
    setSelectedJobName(job.job_name);
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (selectedJobId) {
      exportMutation.mutate({ jobId: selectedJobId, exclude: excludeLitigators });
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const totalPages = resultsData ? Math.ceil(resultsData.total / recordsPerPage) : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            color: '#1E3A5F',
          }}
        >
          ETL Results
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={() => refetchJobs()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Card - Single horizontal card with all stats */}
      {stats && (
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ py: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 3, md: 0 },
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Total Jobs */}
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  textAlign: 'center',
                  px: 2,
                  borderRight: { xs: 'none', md: '1px solid #E2E8F0' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                  <AssessmentIcon sx={{ color: '#104265', fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#718096',
                      fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Total Jobs
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#104265',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  {stats.total_jobs.toLocaleString()}
                </Typography>
              </Box>

              {/* Total Records */}
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  textAlign: 'center',
                  px: 2,
                  borderRight: { xs: 'none', md: '1px solid #E2E8F0' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                  <AssessmentIcon sx={{ color: '#3182CE', fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#718096',
                      fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Total Records
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#3182CE',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  {stats.total_records.toLocaleString()}
                </Typography>
              </Box>

              {/* Clean Records */}
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  textAlign: 'center',
                  px: 2,
                  borderRight: { xs: 'none', md: '1px solid #E2E8F0' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                  <AssessmentIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#718096',
                      fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Clean Records
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#2e7d32',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  {stats.clean_records.toLocaleString()}
                </Typography>
              </Box>

              {/* Litigators */}
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  textAlign: 'center',
                  px: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                  <AssessmentIcon sx={{ color: '#ed6c02', fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#718096',
                      fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Litigators
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#ed6c02',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  {stats.total_litigators.toLocaleString()}
                  <Typography
                    component="span"
                    sx={{
                      ml: 1,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#718096',
                    }}
                  >
                    ({stats.litigator_percentage}%)
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Jobs List */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0, maxWidth: { md: '400px' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Jobs with Results ({jobsData?.total || 0})
              </Typography>
              {isLoadingJobs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : jobsData && jobsData.jobs.length > 0 ? (
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {jobsData.jobs.map((job) => (
                    <Paper
                      key={job.job_id}
                      elevation={selectedJobId === job.job_id ? 3 : 1}
                      sx={{
                        p: 2,
                        mb: 2,
                        cursor: 'pointer',
                        border: selectedJobId === job.job_id ? '2px solid #104265' : 'none',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleJobSelect(job)}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {job.job_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {job.job_id.substring(0, 8)}...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`${job.record_count} records`} size="small" color="primary" />
                        <Chip label={`${job.litigator_count} litigators`} size="small" color="warning" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {new Date(job.last_processed).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No jobs with results found</Alert>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Results Table */}
        <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
          <Card>
            <CardContent>
              {!selectedJobId ? (
                <Alert severity="info">Select a job from the list to view results</Alert>
              ) : (
                <>
                  {/* Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedJobName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={excludeLitigators}
                            onChange={(e) => {
                              setExcludeLitigators(e.target.checked);
                              setCurrentPage(1);
                            }}
                            color="primary"
                          />
                        }
                        label="Exclude Litigators"
                      />
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        sx={{
                          background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                          color: '#FFFFFF',
                          fontWeight: 600,
                        }}
                      >
                        Export CSV
                      </Button>
                    </Box>
                  </Box>

                  {/* Results info */}
                  {resultsData && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip
                        label={`Total: ${resultsData.total.toLocaleString()} records`}
                        color="primary"
                        size="small"
                      />
                      {resultsData.litigator_count !== undefined && (
                        <Chip
                          label={`Litigators: ${resultsData.litigator_count.toLocaleString()}`}
                          color="warning"
                          size="small"
                        />
                      )}
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Per Page</InputLabel>
                        <Select
                          value={recordsPerPage}
                          label="Per Page"
                          onChange={(e) => {
                            setRecordsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <MenuItem value={50}>50</MenuItem>
                          <MenuItem value={100}>100</MenuItem>
                          <MenuItem value={200}>200</MenuItem>
                          <MenuItem value={500}>500</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* Table */}
                  {isLoadingResults ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : resultsData && resultsData.records.length > 0 ? (
                    <>
                      <TableContainer sx={{ maxHeight: '500px', overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Zip</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Phone 1</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Email 1</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Litigator</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Processed</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {resultsData.records.map((record: ETLResultRecord) => (
                              <TableRow key={record.record_id} hover>
                                <TableCell>
                                  {record.first_name} {record.last_name}
                                </TableCell>
                                <TableCell>{record.address}</TableCell>
                                <TableCell>{record.city}</TableCell>
                                <TableCell>{record.state}</TableCell>
                                <TableCell>{record.zip_code}</TableCell>
                                <TableCell>{record.phone_1}</TableCell>
                                <TableCell>{record.email_1}</TableCell>
                                <TableCell>
                                  {record.in_litigator_list === 'Yes' ? (
                                    <Chip label="Yes" size="small" color="warning" />
                                  ) : (
                                    <Chip label="No" size="small" color="success" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">
                                    {new Date(record.processed_at).toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Pagination */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={handlePageChange}
                          color="primary"
                          size="large"
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    </>
                  ) : (
                    <Alert severity="info">No results found for this job</Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};
