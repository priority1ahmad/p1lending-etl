/**
 * JobHistoryCompact Component
 * Compact job history list with inline status and quick actions
 * Inspired by Airtable's record list and Notion's database views
 */

import { Box, Typography, Chip, IconButton, Tooltip, Skeleton } from '@mui/material';
import {
  PlayArrow,
  Visibility,
  Assessment,
  ChevronRight,
  Schedule,
  CheckCircle,
  Error,
  Cancel,
  HourglassEmpty,
} from '@mui/icons-material';
import { palette, borderColors, backgrounds, textColors } from '../../../theme';

export interface JobHistoryItem {
  id: string;
  job_type: 'preview' | 'single_script' | 'combined_scripts';
  script_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_rows_processed?: number;
  row_limit?: number;
  litigator_count?: number;
  dnc_count?: number;
  clean_count?: number;
  started_at?: string;
  completed_at?: string;
  duration?: number; // in seconds
}

export interface JobHistoryCompactProps {
  /** List of recent jobs */
  jobs: JobHistoryItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Max items to show */
  maxItems?: number;
  /** View all handler */
  onViewAll?: () => void;
  /** View results handler */
  onViewResults?: (jobId: string) => void;
  /** View preview handler */
  onViewPreview?: (jobId: string) => void;
}

const statusConfig = {
  pending: {
    icon: HourglassEmpty,
    color: palette.gray[500],
    bgColor: palette.gray[100],
    label: 'Pending',
  },
  running: {
    icon: PlayArrow,
    color: palette.accent[600],
    bgColor: palette.accent[100],
    label: 'Running',
  },
  completed: {
    icon: CheckCircle,
    color: palette.success[600],
    bgColor: palette.success[100],
    label: 'Completed',
  },
  failed: {
    icon: Error,
    color: palette.error[600],
    bgColor: palette.error[100],
    label: 'Failed',
  },
  cancelled: {
    icon: Cancel,
    color: palette.warning[600],
    bgColor: palette.warning[100],
    label: 'Cancelled',
  },
};

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Compact job history list
 *
 * @example
 * <JobHistoryCompact
 *   jobs={recentJobs}
 *   maxItems={5}
 *   onViewResults={(id) => navigate(`/results?job_id=${id}`)}
 *   onViewAll={() => navigate('/history')}
 * />
 */
export function JobHistoryCompact({
  jobs,
  isLoading = false,
  maxItems = 5,
  onViewAll,
  onViewResults,
  onViewPreview,
}: JobHistoryCompactProps) {
  const displayJobs = jobs.slice(0, maxItems);

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${borderColors.default}`,
          backgroundColor: backgrounds.primary,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={100} />
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${borderColors.default}`,
        backgroundColor: backgrounds.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${borderColors.light}`,
          backgroundColor: backgrounds.secondary,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule sx={{ fontSize: 16, color: palette.accent[500] }} />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, fontSize: '0.8125rem', color: textColors.primary }}
          >
            Recent Jobs
          </Typography>
          <Chip
            label={jobs.length}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.625rem',
              backgroundColor: palette.gray[200],
              color: textColors.secondary,
            }}
          />
        </Box>
        {onViewAll && (
          <Typography
            component="button"
            onClick={onViewAll}
            sx={{
              fontSize: '0.75rem',
              color: palette.accent[600],
              fontWeight: 500,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              '&:hover': { color: palette.accent[700] },
            }}
          >
            View all <ChevronRight sx={{ fontSize: 14 }} />
          </Typography>
        )}
      </Box>

      {/* Job list */}
      {displayJobs.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            No jobs yet. Run your first ETL job!
          </Typography>
        </Box>
      ) : (
        <Box>
          {displayJobs.map((job, index) => {
            const config = statusConfig[job.status];
            const StatusIcon = config.icon;
            const isPreview = job.job_type === 'preview';
            const isCompleted = job.status === 'completed';

            return (
              <Box
                key={job.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderBottom:
                    index < displayJobs.length - 1
                      ? `1px solid ${borderColors.light}`
                      : 'none',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: backgrounds.tertiary,
                  },
                }}
              >
                {/* Status icon */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: config.bgColor,
                    flexShrink: 0,
                  }}
                >
                  <StatusIcon sx={{ fontSize: 14, color: config.color }} />
                </Box>

                {/* Job info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: textColors.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {job.script_name}
                    </Typography>
                    <Chip
                      label={isPreview ? 'Preview' : 'ETL'}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.5625rem',
                        fontWeight: 600,
                        backgroundColor: isPreview
                          ? palette.accent[100]
                          : palette.primary[100],
                        color: isPreview
                          ? palette.accent[700]
                          : palette.primary[700],
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
                    >
                      {formatTimeAgo(job.started_at)}
                    </Typography>
                    {job.total_rows_processed != null && (
                      <Typography
                        variant="caption"
                        sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
                      >
                        {job.total_rows_processed.toLocaleString()} rows
                      </Typography>
                    )}
                    {job.duration && (
                      <Typography
                        variant="caption"
                        sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
                      >
                        {formatDuration(job.duration)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Quick stats (for completed ETL jobs) */}
                {!isPreview && isCompleted && (
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      gap: 1.5,
                      alignItems: 'center',
                    }}
                  >
                    <Tooltip title="Clean">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: palette.success[500],
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: palette.success[700],
                          }}
                        >
                          {(job.clean_count || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip title="Litigator">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: palette.warning[500],
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: palette.warning[700],
                          }}
                        >
                          {(job.litigator_count || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip title="DNC">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: palette.error[500],
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: palette.error[700],
                          }}
                        >
                          {(job.dnc_count || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}

                {/* Action button */}
                {isCompleted && (
                  <Tooltip
                    title={isPreview ? 'View Preview' : 'View Results'}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        isPreview
                          ? onViewPreview?.(job.id)
                          : onViewResults?.(job.id)
                      }
                      sx={{
                        color: palette.accent[500],
                        '&:hover': {
                          backgroundColor: palette.accent[50],
                        },
                      }}
                    >
                      {isPreview ? (
                        <Visibility sx={{ fontSize: 16 }} />
                      ) : (
                        <Assessment sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default JobHistoryCompact;
