/**
 * ComprehensiveDashboard Page
 * Main dashboard layout combining all dashboard components
 * Displays overview metrics, active jobs, analytics, and activity feed
 */

import { useState } from 'react';
import { Box, Grid, Skeleton, Alert, AlertTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import {
  DashboardMetricCard,
  QuickActionCard,
  ComplianceDonutChart,
  ProcessingTrendsChart,
  DashboardSection,
  DateRangeSelector,
  type ComplianceData,
  type TrendDataPoint,
  type DateRange,
} from '../components/features/dashboard';
import {
  QuickStatsRow,
  type StatItem,
} from '../components/features/home';
import { textColors, backgrounds, borderColors, palette } from '../theme';

import { jobsApi, type ETLJob } from '../services/api/jobs';
import { scriptsApi } from '../services/api/scripts';
import {
  TrendingUp,
  FileDownload,
  Settings,
  Database,
  BarChart3,
  Clock,
} from '@mui/icons-material';

interface DashboardStats {
  totalJobs: number;
  completedToday: number;
  failedToday: number;
  totalRecordsProcessed: number;
  totalClean: number;
  totalLitigator: number;
  totalDnc: number;
  avgProcessingTime: number;
}

export function ComprehensiveDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('week');

  // Fetch jobs data
  const { data: jobsResponse, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'analytics', dateRange],
    queryFn: async () => {
      const response = await jobsApi.list(0, 100);
      return response.jobs;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch scripts data
  const { data: scripts } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list(),
  });

  // Calculate dashboard statistics
  const calculateStats = (jobs: ETLJob[]): DashboardStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayJobs = jobs.filter((job) => {
      const jobDate = job.created_at ? new Date(job.created_at) : null;
      if (!jobDate) return false;
      jobDate.setHours(0, 0, 0, 0);
      return jobDate.getTime() === today.getTime();
    });

    const completedToday = todayJobs.filter((j) => j.status === 'completed').length;
    const failedToday = todayJobs.filter((j) => j.status === 'failed').length;

    const totalRecordsProcessed = jobs.reduce((sum, j) => sum + (j.total_rows_processed || 0), 0);
    const totalClean = jobs.reduce((sum, j) => sum + (j.clean_count || 0), 0);
    const totalLitigator = jobs.reduce((sum, j) => sum + (j.litigator_count || 0), 0);
    const totalDnc = jobs.reduce((sum, j) => sum + (j.dnc_count || 0), 0);

    const completedJobs = jobs.filter((j) => j.status === 'completed' && j.started_at && j.completed_at);
    const avgProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => {
          if (j.started_at && j.completed_at) {
            const duration = (new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()) / 1000;
            return sum + duration;
          }
          return sum;
        }, 0) / completedJobs.length
      : 0;

    return {
      totalJobs: jobs.length,
      completedToday,
      failedToday,
      totalRecordsProcessed,
      totalClean,
      totalLitigator,
      totalDnc,
      avgProcessingTime: Math.round(avgProcessingTime),
    };
  };

  const stats = jobsResponse ? calculateStats(jobsResponse) : {
    totalJobs: 0,
    completedToday: 0,
    failedToday: 0,
    totalRecordsProcessed: 0,
    totalClean: 0,
    totalLitigator: 0,
    totalDnc: 0,
    avgProcessingTime: 0,
  };

  // Transform data for QuickStatsRow
  const quickStats: StatItem[] = [
    {
      id: 'jobs',
      label: 'Total Jobs',
      value: stats.totalJobs,
      icon: 'jobs',
      color: 'info',
      trend: stats.completedToday > stats.failedToday ? 'up' : stats.completedToday < stats.failedToday ? 'down' : 'neutral',
      trendValue: stats.completedToday > 0 ? `${Math.round((stats.completedToday / (stats.completedToday + stats.failedToday)) * 100)}%` : 'N/A',
    },
    {
      id: 'clean',
      label: 'Clean Records',
      value: stats.totalClean,
      icon: 'clean',
      color: 'success',
    },
    {
      id: 'litigator',
      label: 'Litigators',
      value: stats.totalLitigator,
      icon: 'litigator',
      color: 'warning',
    },
    {
      id: 'dnc',
      label: 'DNC Records',
      value: stats.totalDnc,
      icon: 'dnc',
      color: 'error',
    },
  ];

  // Compliance data for donut chart
  const complianceData: ComplianceData = {
    clean: stats.totalClean,
    litigator: stats.totalLitigator,
    dnc: stats.totalDnc,
    both: 0,
  };

  // Sample trend data (in real implementation, this would come from aggregated data)
  const trendData: TrendDataPoint[] = [
    { date: 'Mon', records: 1250, jobs: 5 },
    { date: 'Tue', records: 1890, jobs: 6 },
    { date: 'Wed', records: 2390, jobs: 8 },
    { date: 'Thu', records: 2490, jobs: 7 },
    { date: 'Fri', records: 2000, jobs: 9 },
    { date: 'Sat', records: 2181, jobs: 4 },
    { date: 'Sun', records: 2100, jobs: 3 },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your ETL operations and data processing"
        actions={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />
            <Button
              variant="ghost"
              size="small"
              startIcon={<Settings />}
              onClick={() => {}}
            >
              Settings
            </Button>
          </Box>
        }
      />

      {/* Error State */}
      {false && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
      )}

      {/* Quick Stats Row */}
      <DashboardSection
        title="Overview"
        subtitle="Key metrics at a glance"
      >
        <QuickStatsRow stats={quickStats} isLoading={jobsLoading} />
      </DashboardSection>

      {/* Top Metrics Grid */}
      <DashboardSection
        title="Key Performance Indicators"
        subtitle="Detailed job and processing metrics"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardMetricCard
              title="Jobs Today"
              value={stats.completedToday}
              icon={<Clock sx={{ fontSize: 24 }} />}
              color={palette.accent[500]}
              trend={{
                value: Math.round(((stats.completedToday || 0) / Math.max(stats.totalJobs, 1)) * 100),
                direction: 'up',
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardMetricCard
              title="Success Rate"
              value={stats.totalJobs > 0 ? ((stats.completedToday / stats.totalJobs) * 100).toFixed(1) : '0'}
              suffix="%"
              icon={<TrendingUp sx={{ fontSize: 24 }} />}
              color={palette.success[500]}
              trend={{
                value: Math.max(0, (stats.completedToday - stats.failedToday)),
                direction: stats.completedToday >= stats.failedToday ? 'up' : 'down',
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardMetricCard
              title="Total Processed"
              value={stats.totalRecordsProcessed}
              icon={<Database sx={{ fontSize: 24 }} />}
              color={palette.primary[600]}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardMetricCard
              title="Avg. Processing Time"
              value={Math.round(stats.avgProcessingTime / 60) || 0}
              suffix="min"
              icon={<Clock sx={{ fontSize: 24 }} />}
              color={palette.accent[500]}
            />
          </Grid>
        </Grid>
      </DashboardSection>

      {/* Analytics Section */}
      <DashboardSection
        title="Analytics & Trends"
        subtitle="Processing volume and compliance breakdown"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ProcessingTrendsChart
              title="7-Day Processing Trend"
              subtitle="Records processed per day"
              data={trendData}
              showJobs
              isLoading={jobsLoading}
              height={320}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ComplianceDonutChart
              title="Compliance Overview"
              subtitle="Record distribution by compliance status"
              data={complianceData}
              isLoading={jobsLoading}
              size={280}
            />
          </Grid>
        </Grid>
      </DashboardSection>

      {/* Quick Actions Section */}
      <DashboardSection
        title="Quick Actions"
        subtitle="Common tasks and shortcuts"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Start New Job"
              description="Run a new ETL job for a selected script"
              icon={<TrendingUp sx={{ fontSize: 28 }} />}
              color={palette.accent[500]}
              onClick={() => navigate('/')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="View Results"
              description="Browse and filter completed job results"
              icon={<BarChart3 sx={{ fontSize: 28 }} />}
              color={palette.success[500]}
              onClick={() => navigate('/results')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Manage Scripts"
              description="View and edit SQL scripts"
              icon={<Database sx={{ fontSize: 28 }} />}
              color={palette.primary[600]}
              onClick={() => navigate('/sql-files')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Export Data"
              description="Download results as CSV or PDF"
              icon={<FileDownload sx={{ fontSize: 28 }} />}
              color={palette.warning[500]}
              onClick={() => {}}
            />
          </Grid>
        </Grid>
      </DashboardSection>

      {/* Job History Section */}
      <DashboardSection
        title="Recent Jobs"
        subtitle="Latest processing jobs and their status"
      >
        {jobsLoading ? (
          <Card>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={60} />
              ))}
            </Box>
          </Card>
        ) : !jobsResponse || jobsResponse.length === 0 ? (
          <EmptyState
            title="No Jobs Yet"
            description="Start by running your first ETL job"
            action={{
              label: 'Create Job',
              onClick: () => navigate('/'),
            }}
          />
        ) : (
          <Card>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {jobsResponse.slice(0, 5).map((job) => (
                <Box
                  key={job.id}
                  sx={{
                    p: 2,
                    border: `1px solid ${borderColors.light}`,
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: backgrounds.tertiary,
                    },
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => navigate(`/results?job_id=${job.id}`)}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 500, color: textColors.primary }}>
                      Job {job.id.slice(0, 8)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: textColors.secondary }}
                    >
                      {job.total_rows_processed || 0} records • {job.status}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor:
                        job.status === 'completed'
                          ? palette.success[50]
                          : job.status === 'failed'
                            ? palette.error[50]
                            : palette.accent[50],
                      color:
                        job.status === 'completed'
                          ? palette.success[700]
                          : job.status === 'failed'
                            ? palette.error[700]
                            : palette.accent[700],
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {job.status}
                  </Typography>
                </Box>
              ))}
              {jobsResponse.length > 5 && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/results')}
                  sx={{ mt: 1 }}
                >
                  View All Jobs
                </Button>
              )}
            </Box>
          </Card>
        )}
      </DashboardSection>

      {/* Footer Info */}
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: `1px solid ${borderColors.light}`,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: textColors.secondary }}
        >
          Dashboard updates every 30 seconds • Last update:{' '}
          {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
}

export default ComprehensiveDashboard;
