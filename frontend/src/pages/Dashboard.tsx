import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Grid } from '@mui/material';
import { PlayArrow, Stop, Preview, History, Visibility, Download, Search, Clear } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../services/api/scripts';
import { jobsApi } from '../services/api/jobs';
import type { ETLJob, JobCreate, JobPreview } from '../services/api/jobs';
import { io, Socket } from 'socket.io-client';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [rowLimit, setRowLimit] = useState<string>('');
  const [currentJob, setCurrentJob] = useState<ETLJob | null>(null);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: string }>>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Array<JobPreview>>([]);
  const [previewLoadingMessage, setPreviewLoadingMessage] = useState<string>('Initializing preview...');
  const [processedRows, setProcessedRows] = useState<Array<{ row_number: number; first_name: string; last_name: string; address: string; status: string; batch?: number }>>([]);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const rowsEndRef = useRef<HTMLDivElement>(null);
  const messageIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [logFileContent, setLogFileContent] = useState<string>('');
  const [logFileLoading, setLogFileLoading] = useState(false);
  const [previewForExecution, setPreviewForExecution] = useState(false); // Track if preview is for job confirmation
  // const [previewStats, setPreviewStats] = useState<any>(null);

  const { data: scripts } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list(),
  });

  const { data: latestJob } = useQuery({
    queryKey: ['jobs', 'latest'],
    queryFn: async () => {
      const response = await jobsApi.list(0, 1);
      return response.jobs.length > 0 ? response.jobs[0] : null;
    },
    refetchInterval: (query) => {
      const job = query.state.data as ETLJob | null;
      return job?.status === 'running' ? 2000 : false;
    },
  });

  // Fetch job history (all jobs including previews)
  const { data: jobHistoryResponse, refetch: refetchHistory } = useQuery({
    queryKey: ['jobs', 'history'],
    queryFn: async () => {
      return await jobsApi.list(0, 50); // Get last 50 jobs
    },
    refetchInterval: 5000, // Refetch every 5 seconds to keep history updated
  });
  
  const jobHistory = jobHistoryResponse?.jobs || [];
  const jobHistoryMessage = jobHistoryResponse?.message;

  useEffect(() => {
    if (latestJob) {
      setCurrentJob(latestJob);
    }
  }, [latestJob]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    if (currentJob && currentJob.status === 'running') {
      // In production, use relative URL (empty) so nginx can proxy socket.io
      // In development, use explicit localhost URL
      const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : undefined);
      const socket = io(socketUrl, {
        path: '/socket.io',
      });

      socket.on('connect', () => {
        socket.emit('join_job', { job_id: currentJob.id });
      });

      socket.on('job_progress', (data: any) => {
        setCurrentJob((prev) => (prev ? { 
          ...prev, 
          progress: data.progress || prev.progress, 
          message: data.message || prev.message,
          current_row: data.current_row,
          total_rows: data.total_rows,
          rows_remaining: data.rows_remaining,
          current_batch: data.current_batch,
          total_batches: data.total_batches
        } : null));
      });

      socket.on('batch_progress', (data: any) => {
        setCurrentJob((prev) => (prev ? { 
          ...prev, 
          current_batch: data.current_batch,
          total_batches: data.total_batches,
          message: data.message || prev.message
        } : null));
      });

      socket.on('row_processed', (data: any) => {
        if (data.row_data) {
          setProcessedRows((prev) => {
            const newRows = [...prev, {
              row_number: data.row_data.row_number || prev.length + 1,
              first_name: data.row_data.first_name || '',
              last_name: data.row_data.last_name || '',
              address: data.row_data.address || '',
              status: data.row_data.status || 'Processing',
              batch: data.batch
            }];
            // Keep only last 50 rows
            return newRows.slice(-50);
          });
        }
      });

      socket.on('job_log', (data: any) => {
        setLogs((prev) => [
          ...prev,
          {
            level: data.level || 'INFO',
            message: data.message,
            timestamp: new Date().toISOString(),
          },
        ]);
      });

      socket.on('job_complete', (data: any) => {
        setCurrentJob((prev) => (prev ? { ...prev, status: 'completed', progress: 100, ...data } : null));
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      });

      socket.on('job_error', (data: any) => {
        setCurrentJob((prev) => (prev ? { ...prev, status: 'failed', error_message: data.error } : null));
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      });

      socketRef.current = socket;

      return () => {
        socket.emit('leave_job', { job_id: currentJob.id });
        socket.disconnect();
      };
    }
  }, [currentJob?.id, currentJob?.status, queryClient]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Auto-scroll processed rows
  useEffect(() => {
    rowsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processedRows]);

  const createJobMutation = useMutation({
    mutationFn: (data: JobCreate) => jobsApi.create(data),
    onSuccess: (job) => {
      setCurrentJob(job);
      setLogs([]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      refetchHistory(); // Refresh history after creating job
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: (id: string) => jobsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setCurrentJob(null);
    },
  });

  const previewMutation = useMutation({
    mutationFn: ({ scriptIds, rowLimit }: { scriptIds: string[]; rowLimit?: number }) => 
      jobsApi.preview(scriptIds, rowLimit),
    onSuccess: (data) => {
      setPreviewData(data);
      refetchHistory(); // Refresh history after preview
    },
  });

  const handleStartETL = () => {
    if (!selectedScriptId) {
      alert('Please select a script');
      return;
    }

    const script = scripts?.find((s) => s.id === selectedScriptId);
    if (!script) return;

    // Always show preview first as confirmation
    // Pass true to indicate this is for execution confirmation
    handleGetPreview(true); // Show preview dialog with confirmation buttons
  };

  const handleConfirmAndExecuteETL = () => {
    if (!selectedScriptId) {
      alert('Please select a script');
      return;
    }

    const script = scripts?.find((s) => s.id === selectedScriptId);
    if (!script) return;

    // Close preview dialog
    setPreviewDialogOpen(false);
    setPreviewForExecution(false);
    previewMutation.reset();

    // Now start the actual ETL job
    createJobMutation.mutate({
      script_id: selectedScriptId,
      job_type: 'single_script',
      row_limit: rowLimit ? parseInt(rowLimit) : undefined,
    });
    // Clear processed rows when starting new job
    setProcessedRows([]);
  };

  const handleGetPreview = (isForExecution: boolean = false) => {
    if (!selectedScriptId) {
      alert('Please select a script');
      return;
    }
    // Set the flag based on the parameter
    setPreviewForExecution(isForExecution);
    // Open dialog immediately to show loading state
    setPreviewDialogOpen(true);
    setPreviewData([]); // Clear previous data
    setPreviewLoadingMessage('Initializing preview...');
    
    // Clear any existing interval
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    
    // Poll for the latest preview job status while mutation is pending
    messageIntervalRef.current = setInterval(async () => {
      if (previewMutation.isPending) {
        try {
          // Get the latest preview job for this script
          const response = await jobsApi.list(0, 10);
          const previewJobs = response.jobs.filter(
            job => job.job_type === 'preview' && 
                   job.script_id === selectedScriptId &&
                   (job.status === 'running' || job.status === 'pending')
          );
          
          if (previewJobs.length > 0) {
            const latestPreviewJob = previewJobs[0];
            if (latestPreviewJob.message) {
              setPreviewLoadingMessage(latestPreviewJob.message);
            }
          }
        } catch (error) {
          // Silently fail - don't interrupt the preview
        }
      }
    }, 500); // Poll every 500ms for status updates
    
    // Clear interval when mutation completes
    previewMutation.mutate(
      { 
        scriptIds: [selectedScriptId], 
        rowLimit: rowLimit ? parseInt(rowLimit) : undefined 
      },
      {
        onSettled: () => {
          if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
          }
        },
        onSuccess: (data) => {
          setPreviewData(data);
        },
        onError: (error) => {
          console.error('Preview error:', error);
        }
      }
    );
  };
    
    // Clear any existing interval
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    
    // Poll for the latest preview job status while mutation is pending
    messageIntervalRef.current = setInterval(async () => {
      if (previewMutation.isPending) {
        try {
          // Get the latest preview job for this script
          const response = await jobsApi.list(0, 10);
          const previewJobs = response.jobs.filter(
            job => job.job_type === 'preview' && 
                   job.script_id === selectedScriptId &&
                   (job.status === 'running' || job.status === 'pending')
          );
          
          if (previewJobs.length > 0) {
            const latestPreviewJob = previewJobs[0];
            if (latestPreviewJob.message) {
              setPreviewLoadingMessage(latestPreviewJob.message);
            }
          }
        } catch (error) {
          // Silently fail - don't interrupt the preview
        }
      }
    }, 500); // Poll every 500ms for status updates
    
    // Clear interval when mutation completes
    previewMutation.mutate(
      { 
        scriptIds: [selectedScriptId], 
        rowLimit: rowLimit ? parseInt(rowLimit) : undefined 
      },
      {
        onSettled: () => {
          if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
          }
        }
      }
    );
  };

  const handleCancel = () => {
    if (currentJob) {
      cancelJobMutation.mutate(currentJob.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            color: '#1E3A5F',
          }}
        >
          Dashboard
        </Typography>
        <Typography 
          variant="body1" 
          sx={{
            color: '#4A5568',
            fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
          }}
        >
          ETL Control Panel
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Card sx={{ maxWidth: '600px', width: '100%' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                fontWeight: 600,
                color: '#1E3A5F',
              }}
            >
              ETL Control Panel
            </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>SQL Script</InputLabel>
                  <Select
                    value={selectedScriptId}
                    onChange={(e) => setSelectedScriptId(e.target.value)}
                    label="SQL Script"
                  >
                    <MenuItem value="">Select a script...</MenuItem>
                    {scripts?.map((script) => (
                      <MenuItem key={script.id} value={script.id}>
                        {script.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Row Limit (Optional)"
                  type="number"
                  value={rowLimit}
                  onChange={(e) => setRowLimit(e.target.value)}
                  helperText="Leave empty to process all records"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Preview />}
                    onClick={() => handleGetPreview(false)}
                    disabled={!selectedScriptId || previewMutation.isPending}
                    sx={{
                      borderColor: '#1E3A5F',
                      color: '#1E3A5F',
                      borderWidth: '2px',
                      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      '&:hover': {
                        borderWidth: '2px',
                        backgroundColor: '#1E3A5F',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    {previewMutation.isPending ? 'Loading...' : 'Get Preview'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleStartETL}
                    disabled={!selectedScriptId || createJobMutation.isPending || currentJob?.status === 'running'}
                    sx={{
                      background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                      color: '#FFFFFF',
                      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                        boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: '#CBD5E0',
                        color: '#718096',
                      },
                    }}
                  >
                    Start ETL
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

      {/* Job History Log */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Card sx={{ maxWidth: '1200px', width: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <History sx={{ color: '#1E3A5F' }} />
              <Typography 
                variant="h6"
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                Run History
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: '#718096',
                fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
              }}
            >
              View all preview requests and ETL job runs. Click on a preview to view details.
            </Typography>
            
            {jobHistoryMessage && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F7FAFC', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#4A5568',
                    fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                    fontSize: '0.875rem',
                  }}
                >
                  {jobHistoryMessage}
                </Typography>
              </Box>
            )}
            
            {jobHistory && jobHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#718096',
                    fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  No job history yet. Run a preview or start an ETL job to see history.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Type</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Script</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Processed</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F', textAlign: 'center' }}>Litigator</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F', textAlign: 'center' }}>DNC</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F', textAlign: 'center' }}>Both</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F', textAlign: 'center' }}>Clean</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Started</TableCell>
                      <TableCell sx={{ fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif', fontWeight: 600, color: '#1E3A5F' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobHistory?.map((job) => {
                      const script = scripts?.find(s => s.id === job.script_id);
                      const isPreview = job.job_type === 'preview';
                      const formatDate = (dateString?: string) => {
                        if (!dateString) return 'N/A';
                        return new Date(dateString).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      };
                      
                      return (
                        <TableRow key={job.id} hover>
                          <TableCell>
                            <Chip
                              label={isPreview ? 'Preview' : 'ETL Run'}
                              size="small"
                              sx={{
                                backgroundColor: isPreview ? '#4A90D9' : '#1E3A5F',
                                color: '#FFFFFF',
                                fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568' }}>
                            {script?.name || 'Unknown Script'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={job.status.toUpperCase()}
                              color={getStatusColor(job.status) as any}
                              size="small"
                              sx={{
                                fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568' }}>
                            {job.row_limit 
                              ? `${job.total_rows_processed?.toLocaleString() || '0'}/${job.row_limit.toLocaleString()}`
                              : job.total_rows_processed?.toLocaleString() || '0'
                            }
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568', textAlign: 'center' }}>
                            {!isPreview && job.status === 'completed' ? (job.litigator_count || 0) : '-'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568', textAlign: 'center' }}>
                            {!isPreview && job.status === 'completed' ? (job.dnc_count || 0) : '-'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568', textAlign: 'center' }}>
                            {!isPreview && job.status === 'completed' ? (job.both_count || 0) : '-'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#4A5568', textAlign: 'center' }}>
                            {!isPreview && job.status === 'completed' ? (job.clean_count || 0) : '-'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif', color: '#718096', fontSize: '0.875rem' }}>
                            {formatDate(job.started_at || job.created_at)}
                          </TableCell>
                          <TableCell>
                            {isPreview && job.status === 'completed' && (
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => {
                                  // Fetch preview data for this job
                                  if (job.script_id) {
                                    setPreviewDialogOpen(true);
                                    setPreviewLoadingMessage('Loading preview data...');
                                    previewMutation.mutate(
                                      { 
                                        scriptIds: [job.script_id], 
                                        rowLimit: job.row_limit 
                                      },
                                      {
                                        onSuccess: () => {
                                          setPreviewLoadingMessage('');
                                        }
                                      }
                                    );
                                  }
                                }}
                                sx={{
                                  color: '#4A90D9',
                                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                                  fontWeight: 500,
                                  textTransform: 'none',
                                  '&:hover': {
                                    backgroundColor: '#F7F9FC',
                                  },
                                }}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Job Status and Progress */}
      {currentJob && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Card sx={{ maxWidth: '1200px', width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6"
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                  }}
                >
                  Job Status
                </Typography>
                <Chip
                  label={currentJob.status.toUpperCase()}
                  color={getStatusColor(currentJob.status) as any}
                  size="small"
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  }}
                />
              </Box>
              
              {currentJob.status === 'running' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={currentJob.progress} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {currentJob.progress}% - {currentJob.message || 'Processing...'}
                    </Typography>
                  </Box>
                  
                  {/* Detailed Progress */}
                  {(currentJob.total_rows !== undefined || currentJob.current_batch !== undefined) && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        {currentJob.total_rows !== undefined && (
                          <>
                            {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                Rows Processed
                              </Typography>
                              <Typography variant="h6">
                                {currentJob.current_row || 0} / {currentJob.total_rows}
                              </Typography>
                            </Grid>
                            {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                Rows Remaining
                              </Typography>
                              <Typography variant="h6">
                                {currentJob.rows_remaining || 0}
                              </Typography>
                            </Grid>
                            {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                Percentage
                              </Typography>
                              <Typography variant="h6">
                                {currentJob.progress}%
                              </Typography>
                            </Grid>
                            {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                Batch
                              </Typography>
                              <Typography variant="h6">
                                {currentJob.current_batch || 0} / {currentJob.total_batches || 0}
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleCancel}
                    disabled={cancelJobMutation.isPending}
                    sx={{
                      borderColor: '#E53E3E',
                      color: '#E53E3E',
                      borderWidth: '2px',
                      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      '&:hover': {
                        borderWidth: '2px',
                        backgroundColor: '#E53E3E',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    Stop Job
                  </Button>
                </>
              )}
              
              {currentJob.message && currentJob.status !== 'completed' && currentJob.status !== 'running' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {currentJob.message}
                  </Typography>
                  {(currentJob.status === 'failed' || currentJob.status === 'cancelled') && (
                    <Button
                      startIcon={<Visibility />}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setLogFileLoading(true);
                        jobsApi.getLogFile(currentJob.id).then((data) => {
                          setLogFileContent(data.content);
                          setLogFileLoading(false);
                          setLogViewerOpen(true);
                        }).catch(() => {
                          setLogFileLoading(false);
                        });
                      }}
                      sx={{
                        borderColor: '#1E3A5F',
                        color: '#1E3A5F',
                        fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                      }}
                    >
                      View Log File
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Statistics */}
      {currentJob && currentJob.status === 'completed' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Card sx={{ maxWidth: '1200px', width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                  }}
                >
                  Statistics
                </Typography>
                <Button
                  startIcon={<Visibility />}
                  variant="outlined"
                  onClick={() => {
                    setLogFileLoading(true);
                    jobsApi.getLogFile(currentJob.id).then((data) => {
                      setLogFileContent(data.content);
                      setLogFileLoading(false);
                      setLogViewerOpen(true);
                    }).catch(() => {
                      setLogFileLoading(false);
                    });
                  }}
                  sx={{
                    borderColor: '#1E3A5F',
                    color: '#1E3A5F',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  }}
                >
                  View Log File
                </Button>
              </Box>
              <Grid container spacing={2}>
                {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Processed
                  </Typography>
                  <Typography variant="h5">{currentJob.total_rows_processed}</Typography>
                </Grid>
                {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Typography variant="body2" color="text.secondary">
                    Litigator Count
                  </Typography>
                  <Typography variant="h5" color="error">
                    {currentJob.litigator_count}
                  </Typography>
                </Grid>
                {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Typography variant="body2" color="text.secondary">
                    DNC Count
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {currentJob.dnc_count}
                  </Typography>
                </Grid>
                {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Typography variant="body2" color="text.secondary">
                    Both Count
                  </Typography>
                  <Typography variant="h5" color="error">
                    {currentJob.both_count}
                  </Typography>
                </Grid>
                {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Typography variant="body2" color="text.secondary">
                    Clean Count
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {currentJob.clean_count}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Real-time Logs */}
      {currentJob && (currentJob.status === 'running' || currentJob.status === 'completed' || currentJob.status === 'failed') && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Card sx={{ maxWidth: '1200px', width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                  }}
                >
                  Live Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="View Full Log File">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setLogFileLoading(true);
                        jobsApi.getLogFile(currentJob.id).then((data) => {
                          setLogFileContent(data.content);
                          setLogFileLoading(false);
                          setLogViewerOpen(true);
                        }).catch(() => {
                          setLogFileLoading(false);
                        });
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {/* Log Filters */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={logFilter}
                    label="Filter"
                    onChange={(e) => setLogFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All</MenuItem>
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="WARNING">Warning</MenuItem>
                    <MenuItem value="ERROR">Error</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: logSearch && (
                      <IconButton size="small" onClick={() => setLogSearch('')}>
                        <Clear />
                      </IconButton>
                    ),
                  }}
                  sx={{ flexGrow: 1, maxWidth: 300 }}
                />
              </Box>
              
              <Paper
                sx={{
                  height: '400px',
                  overflow: 'auto',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {logs
                  .filter((log) => {
                    if (logFilter !== 'ALL' && log.level !== logFilter) return false;
                    if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
                    return true;
                  })
                  .map((log, index) => (
                    <Box
                      key={index}
                      sx={{
                        color:
                          log.level === 'ERROR'
                            ? '#f48771'
                            : log.level === 'WARNING'
                            ? '#cca700'
                            : '#4ec9b0',
                        mb: 0.5,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <span style={{ color: '#858585', minWidth: '180px' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ minWidth: '80px' }}>[{log.level}]</span>
                      <span>{log.message}</span>
                    </Box>
                  ))}
                {logs.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#858585', textAlign: 'center', mt: 4 }}>
                    No logs available yet
                  </Typography>
                )}
                <div ref={logsEndRef} />
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Row-by-Row Processing Display */}
      {currentJob && currentJob.status === 'running' && processedRows.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Card sx={{ maxWidth: '1200px', width: '100%' }}>
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                Processing Status - Last {processedRows.length} Rows
              </Typography>
              <Paper
                sx={{
                  height: '400px',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                }}
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row #</TableCell>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Batch</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {processedRows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.row_number}</TableCell>
                          <TableCell>{row.first_name}</TableCell>
                          <TableCell>{row.last_name}</TableCell>
                          <TableCell>{row.address}</TableCell>
                          <TableCell>{row.batch || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.status} 
                              size="small" 
                              color={row.status === 'Completed' ? 'success' : 'info'} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <div ref={rowsEndRef} />
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => {
          if (!previewMutation.isPending) {
            setPreviewDialogOpen(false);
            previewMutation.reset();
            // Clear interval when dialog closes
            if (messageIntervalRef.current) {
              clearInterval(messageIntervalRef.current);
              messageIntervalRef.current = null;
            }
          }
        }} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {previewForExecution ? 'ETL Job Preview & Confirmation' : 'ETL Job Preview'}
          </Typography>
          {previewForExecution && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              ⚠️ Large queries may take 5-10 minutes to process. Please review the preview before confirming.
            </Typography>
          )}
          {previewMutation.isPending && (
            <CircularProgress size={20} sx={{ ml: 2, verticalAlign: 'middle' }} />
          )}
        </DialogTitle>
        <DialogContent>
          {previewMutation.isPending ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                {previewLoadingMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please wait while we fetch your data...
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
              </Box>
            </Box>
          ) : previewMutation.isError ? (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="error">
                Error loading preview: {previewMutation.error instanceof Error ? previewMutation.error.message : 'Unknown error'}
              </Typography>
            </Box>
          ) : previewData.length === 0 ? (
            <Typography variant="body2" sx={{ py: 2 }}>
              No preview data available
            </Typography>
          ) : (
            <>
              {previewForExecution && previewData.length > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600, mb: 1 }}>
                    ⚠️ Performance Notice
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Large queries with many records may take 5-10 minutes to complete. The ETL process will:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
                    <Typography component="li" variant="body2" color="text.secondary">
                      Check each record against the processed cache
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                      Look up phone numbers and emails via idiCORE API
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                      Check against litigator and DNC lists
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                      Upload results to Google Sheets and Snowflake
                    </Typography>
                  </Box>
                </Box>
              )}
              {previewData.map((item, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {item.script_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Rows: {(item.total_rows ?? item.row_count).toLocaleString()}
              </Typography>
              
              {/* Processing Status - Always show when we have preview data */}
              {item.total_rows !== undefined && (
                <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom
                    sx={{
                      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 600,
                      color: '#1E3A5F',
                      mb: 1.5,
                    }}
                  >
                    Processing Status
                  </Typography>
                  <Grid container spacing={2}>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Already Processed
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {(item.already_processed ?? 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        New to Process
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {(item.unprocessed ?? 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Stats Section */}
              {currentJob && (currentJob.status === 'completed' || currentJob.status === 'failed') && (
                <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                      fontWeight: 600,
                      color: '#1E3A5F',
                      mb: 2,
                    }}
                  >
                    Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Total Processed
                      </Typography>
                      <Typography variant="h5">{currentJob.total_rows_processed || 0}</Typography>
                    </Grid>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Litigator Count
                      </Typography>
                      <Typography variant="h5" color="error">
                        {currentJob.litigator_count || 0}
                      </Typography>
                    </Grid>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        DNC Count
                      </Typography>
                      <Typography variant="h5" color="warning.main">
                        {currentJob.dnc_count || 0}
                      </Typography>
                    </Grid>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Both Count
                      </Typography>
                      <Typography variant="h5" color="error">
                        {currentJob.both_count || 0}
                      </Typography>
                    </Grid>
                    {/* @ts-ignore - MUI v7 Grid item prop works at runtime but types don't support it */}
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Clean Count
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {currentJob.clean_count || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {item.rows && item.rows.length > 0 ? (
                <TableContainer sx={{ mt: 2, maxHeight: '500px', overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {Object.keys(item.rows[0]).map((key) => (
                          <TableCell key={key}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {value !== null && value !== undefined ? String(value) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  No row data available. Set a row limit to preview actual data.
                </Typography>
              )}
            </Box>
            ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {previewForExecution ? (
            <>
              <Button 
                onClick={() => {
                  setPreviewDialogOpen(false);
                  setPreviewForExecution(false);
                  previewMutation.reset();
                }}
                disabled={previewMutation.isPending}
                sx={{
                  borderColor: '#1E3A5F',
                  color: '#1E3A5F',
                  borderWidth: '2px',
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  '&:hover': {
                    borderWidth: '2px',
                    backgroundColor: '#1E3A5F',
                    color: '#FFFFFF',
                  },
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAndExecuteETL}
                disabled={previewMutation.isPending || previewData.length === 0}
                sx={{
                  backgroundColor: '#1E3A5F',
                  color: '#FFFFFF',
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  '&:hover': {
                    backgroundColor: '#2a4d7a',
                  },
                  '&:disabled': {
                    backgroundColor: '#cccccc',
                    color: '#666666',
                  },
                }}
                variant="contained"
                startIcon={<PlayArrow />}
              >
                {previewMutation.isPending ? 'Loading Preview...' : 'Execute ETL Job'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => {
                setPreviewDialogOpen(false);
                setPreviewForExecution(false);
                previewMutation.reset();
              }}
              disabled={previewMutation.isPending}
              sx={{
                borderColor: '#1E3A5F',
                color: '#1E3A5F',
                borderWidth: '2px',
                fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                '&:hover': {
                  borderWidth: '2px',
                  backgroundColor: '#1E3A5F',
                  color: '#FFFFFF',
                },
              }}
              variant="outlined"
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Log File Viewer Dialog */}
      <Dialog
        open={logViewerOpen}
        onClose={() => setLogViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Log File</Typography>
            {logFileContent && (
              <Button
                startIcon={<Download />}
                onClick={() => {
                  const blob = new Blob([logFileContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `job-${currentJob?.id || 'log'}.log`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Download
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {logFileLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logFileContent ? (
            <Paper
              sx={{
                height: '600px',
                overflow: 'auto',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                p: 2,
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {logFileContent.split('\n').map((line, index) => (
                <Box
                  key={index}
                  sx={{
                    color: line.includes('ERROR') || line.includes('❌')
                      ? '#f48771'
                      : line.includes('WARNING') || line.includes('⚠️')
                      ? '#cca700'
                      : '#4ec9b0',
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <span style={{ color: '#858585', minWidth: '40px' }}>{index + 1}</span>
                  <span>{line}</span>
                </Box>
              ))}
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No log file available for this job.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogViewerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
