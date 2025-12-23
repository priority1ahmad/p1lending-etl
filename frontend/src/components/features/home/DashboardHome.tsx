/**
 * DashboardHome Component
 * Main home page layout combining ETL control, job status, and history
 * Inspired by Airtable's dashboard interface and modern ETL monitoring tools
 *
 * Layout follows the inverted pyramid model:
 * - Top: Quick stats and active job status (most critical)
 * - Middle: ETL controls
 * - Bottom: Job history (supporting details)
 */

import { Box, Typography } from '@mui/material';
import { Refresh, Settings } from '@mui/icons-material';
import { QuickStatsRow, type StatItem } from './QuickStatsRow';
import { CompactJobControl, type Script } from './CompactJobControl';
import { ActiveJobCard } from './ActiveJobCard';
import { JobHistoryCompact, type JobHistoryItem } from './JobHistoryCompact';
import { ActivityFeed, type ActivityItem } from './ActivityFeed';
import { Button } from '../../ui/Button/Button';
import { palette, textColors, borderColors } from '../../../theme';

export interface DashboardStats {
  totalProcessed: number;
  totalClean: number;
  totalLitigator: number;
  totalDnc: number;
  jobsToday: number;
  avgProcessingTime?: string;
}

export interface ActiveJob {
  id: string;
  scriptName: string;
  progress: number;
  currentRow?: number;
  totalRows?: number;
  currentBatch?: number;
  totalBatches?: number;
  message?: string;
  elapsedTime?: number;
  timeRemaining?: string;
  stats?: {
    clean: number;
    litigator: number;
    dnc: number;
  };
}

export interface DashboardHomeProps {
  /** Summary statistics */
  stats: DashboardStats;
  /** List of available scripts */
  scripts: Script[];
  /** Recent job history */
  jobHistory: JobHistoryItem[];
  /** Currently active job (if any) */
  activeJob?: ActiveJob;
  /** Live activity feed items */
  activities?: ActivityItem[];
  /** Selected script ID */
  selectedScriptId: string;
  /** Row limit value */
  rowLimit: string;
  /** Loading states */
  isLoading?: boolean;
  isPreviewLoading?: boolean;
  isJobLoading?: boolean;
  isJobStopping?: boolean;
  /** Event handlers */
  onScriptChange: (scriptId: string) => void;
  onRowLimitChange: (value: string) => void;
  onPreview: () => void;
  onStartETL: () => void;
  onStopJob?: () => void;
  onRefresh?: () => void;
  onViewResults?: (jobId: string) => void;
  onViewPreview?: (jobId: string) => void;
  onViewAllHistory?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Main dashboard home page layout
 */
export function DashboardHome({
  stats,
  scripts,
  jobHistory,
  activeJob,
  activities = [],
  selectedScriptId,
  rowLimit,
  isLoading = false,
  isPreviewLoading = false,
  isJobLoading = false,
  isJobStopping = false,
  onScriptChange,
  onRowLimitChange,
  onPreview,
  onStartETL,
  onStopJob,
  onRefresh,
  onViewResults,
  onViewPreview,
  onViewAllHistory,
  onOpenSettings,
}: DashboardHomeProps) {
  // Transform stats into format for QuickStatsRow
  const statItems: StatItem[] = [
    {
      id: 'total',
      label: 'Total Processed',
      value: stats.totalProcessed,
      icon: 'jobs',
      color: 'info',
    },
    {
      id: 'clean',
      label: 'Clean',
      value: stats.totalClean,
      icon: 'clean',
      color: 'success',
    },
    {
      id: 'litigator',
      label: 'Litigator',
      value: stats.totalLitigator,
      icon: 'litigator',
      color: 'warning',
    },
    {
      id: 'dnc',
      label: 'DNC',
      value: stats.totalDnc,
      icon: 'dnc',
      color: 'error',
    },
    {
      id: 'today',
      label: 'Jobs Today',
      value: stats.jobsToday,
      icon: 'speed',
      color: 'default',
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: textColors.primary,
              mb: 0.5,
            }}
          >
            ETL Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: textColors.secondary }}
          >
            Monitor and manage your data enrichment pipeline
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRefresh && (
            <Button
              variant="ghost"
              size="small"
              startIcon={<Refresh />}
              onClick={onRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          )}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="small"
              startIcon={<Settings />}
              onClick={onOpenSettings}
            >
              Settings
            </Button>
          )}
        </Box>
      </Box>

      {/* Quick Stats - Top row */}
      <Box sx={{ mb: 3 }}>
        <QuickStatsRow stats={statItems} isLoading={isLoading} compact />
      </Box>

      {/* Main content grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Left column - Controls and Active Job */}
        <Box>
          {/* Active Job (if running) */}
          {activeJob && (
            <Box sx={{ mb: 3 }}>
              <ActiveJobCard
                jobId={activeJob.id}
                scriptName={activeJob.scriptName}
                progress={activeJob.progress}
                currentRow={activeJob.currentRow}
                totalRows={activeJob.totalRows}
                currentBatch={activeJob.currentBatch}
                totalBatches={activeJob.totalBatches}
                message={activeJob.message}
                elapsedTime={activeJob.elapsedTime}
                timeRemaining={activeJob.timeRemaining}
                stats={activeJob.stats}
                onStop={onStopJob}
                isStopping={isJobStopping}
              />
            </Box>
          )}

          {/* ETL Controls */}
          <Box sx={{ mb: 3 }}>
            <CompactJobControl
              scripts={scripts}
              selectedScriptId={selectedScriptId}
              rowLimit={rowLimit}
              isPreviewLoading={isPreviewLoading}
              isJobLoading={isJobLoading}
              isJobRunning={!!activeJob}
              onScriptChange={onScriptChange}
              onRowLimitChange={onRowLimitChange}
              onPreview={onPreview}
              onStartETL={onStartETL}
            />
          </Box>

          {/* Live Activity Feed */}
          {activeJob && (
            <ActivityFeed
              activities={activities}
              title="Processing Activity"
              maxHeight={200}
              compact
              autoScroll
            />
          )}
        </Box>

        {/* Right column - Job History */}
        <Box>
          <JobHistoryCompact
            jobs={jobHistory}
            isLoading={isLoading}
            maxItems={8}
            onViewAll={onViewAllHistory}
            onViewResults={onViewResults}
            onViewPreview={onViewPreview}
          />
        </Box>
      </Box>

      {/* Footer hint */}
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
          Select a SQL script and click "Run ETL" to start processing leads.
          View results on the{' '}
          <Box
            component="span"
            sx={{ color: palette.accent[600], fontWeight: 500 }}
          >
            Results
          </Box>{' '}
          page.
        </Typography>
      </Box>
    </Box>
  );
}

export default DashboardHome;
