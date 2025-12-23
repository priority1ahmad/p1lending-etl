/**
 * ActiveJobMonitor Component
 * Real-time job progress monitoring
 * Shows live status, progress bar, and key metrics
 */

import { Box, Typography, LinearProgress, Button, Chip } from '@mui/material';
import { Stop, Refresh } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { palette } from '../../../theme';

export interface JobProgress {
  /** Current row being processed */
  currentRow: number;
  /** Total rows to process */
  totalRows: number;
  /** Rows remaining to process */
  rowsRemaining?: number;
  /** Current batch number */
  currentBatch?: number;
  /** Total batches */
  totalBatches?: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Status message */
  message?: string;
  /** Time remaining (formatted: "Xm Ys" or "Xh Ym") */
  timeRemaining?: string;
  /** Elapsed time in seconds */
  elapsedTime?: number;
  /** Statistics */
  stats?: {
    clean: number;
    litigator: number;
    dnc: number;
  };
}

export interface ActiveJobMonitorProps {
  /** Job name/identifier */
  jobName: string;
  /** Job status */
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  /** Progress data */
  progress?: JobProgress;
  /** Stop job handler */
  onStop?: () => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Format elapsed time from seconds to human-readable string
 */
function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

/**
 * Real-time job monitoring card
 *
 * @example
 * <ActiveJobMonitor
 *   jobName="Daily Leads Processing"
 *   status="running"
 *   progress={{
 *     currentRow: 1234,
 *     totalRows: 5000,
 *     currentBatch: 3,
 *     totalBatches: 12,
 *     progress: 45,
 *     timeRemaining: "5m 30s",
 *     elapsedTime: 240,
 *     stats: { clean: 1050, litigator: 120, dnc: 64 },
 *   }}
 *   onStop={() => console.log('Stop job')}
 * />
 */
export function ActiveJobMonitor({
  jobName,
  status,
  progress,
  onStop,
  onRefresh,
  isLoading = false,
}: ActiveJobMonitorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return palette.accent[500];
      case 'completed':
        return palette.success[500];
      case 'failed':
        return palette.error[500];
      case 'cancelled':
        return palette.gray[500];
      default:
        return palette.gray[400];
    }
  };

  const getStatusLabel = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Check if message indicates upload phase
  const isUploading = progress?.message?.toLowerCase().includes('uploading');

  return (
    <Card variant="default" padding="md">
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
            variant="h6"
            sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 0.5 }}
          >
            {jobName}
          </Typography>
          <Chip
            label={getStatusLabel()}
            size="small"
            sx={{
              backgroundColor: `${getStatusColor()}15`,
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {status === 'running' && onRefresh && (
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Progress Bar */}
      {status === 'running' && progress && (
        <>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {progress.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            {progress.message && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {progress.message}
              </Typography>
            )}
          </Box>

          {/* Upload Indicator */}
          {isUploading && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: palette.accent[50],
                borderRadius: 2,
                border: `2px solid ${palette.accent[200]}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: palette.accent[700] }}
              >
                📤 Uploading results to Snowflake...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please wait while all processed records are being stored
              </Typography>
            </Box>
          )}

          {/* Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 2,
              p: 2,
              backgroundColor: palette.gray[50],
              borderRadius: 2,
              mb: 2,
            }}
          >
            {/* Rows Progress */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rows Processed
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {progress.currentRow.toLocaleString()} /{' '}
                {progress.totalRows.toLocaleString()}
              </Typography>
            </Box>

            {/* Rows Remaining */}
            {progress.rowsRemaining !== undefined && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rows Remaining
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: palette.accent[600] }}
                >
                  {progress.rowsRemaining.toLocaleString()}
                </Typography>
              </Box>
            )}

            {/* Batch Progress */}
            {progress.currentBatch !== undefined &&
              progress.totalBatches !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Batch Progress
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {progress.currentBatch} / {progress.totalBatches}
                  </Typography>
                </Box>
              )}

            {/* Time Remaining */}
            {progress.timeRemaining && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Time Remaining
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: palette.primary[600] }}
                >
                  {progress.timeRemaining}
                </Typography>
              </Box>
            )}

            {/* Elapsed Time */}
            {progress.elapsedTime !== undefined && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Elapsed Time
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatElapsedTime(progress.elapsedTime)}
                </Typography>
              </Box>
            )}

            {/* Stats */}
            {progress.stats && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Clean
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: palette.success[600] }}
                  >
                    {progress.stats.clean.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Litigator
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: palette.warning[600] }}
                  >
                    {progress.stats.litigator.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    DNC
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: palette.warning[700] }}
                  >
                    {progress.stats.dnc.toLocaleString()}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          {/* Stop Button */}
          {onStop && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={onStop}
              fullWidth
              sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Stop Job
            </Button>
          )}
        </>
      )}

      {/* Completed/Failed/Cancelled State */}
      {status !== 'running' && (
        <Box
          sx={{
            p: 2,
            backgroundColor: palette.gray[50],
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {status === 'completed' && 'Job completed successfully'}
            {status === 'failed' && 'Job failed - check logs for details'}
            {status === 'cancelled' && 'Job was cancelled'}
          </Typography>
        </Box>
      )}
    </Card>
  );
}

export default ActiveJobMonitor;
