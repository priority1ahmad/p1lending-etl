/**
 * ActiveJobCard Component
 * Compact running job status card with progress and quick actions
 * Inspired by Retool's ETL monitoring dashboard widgets
 */

import { Box, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { Stop, Refresh, OpenInNew, Schedule } from '@mui/icons-material';
import { palette, textColors } from '../../../theme';

export interface ActiveJobCardProps {
  /** Job ID */
  jobId: string;
  /** Script name */
  scriptName: string;
  /** Current progress (0-100) */
  progress: number;
  /** Current row being processed */
  currentRow?: number;
  /** Total rows to process */
  totalRows?: number;
  /** Current batch */
  currentBatch?: number;
  /** Total batches */
  totalBatches?: number;
  /** Status message */
  message?: string;
  /** Elapsed time in seconds */
  elapsedTime?: number;
  /** Estimated time remaining */
  timeRemaining?: string;
  /** Live stats */
  stats?: {
    clean: number;
    litigator: number;
    dnc: number;
  };
  /** Stop handler */
  onStop?: () => void;
  /** View details handler */
  onViewDetails?: () => void;
  /** Is stopping */
  isStopping?: boolean;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Displays active job status in a compact card
 *
 * @example
 * <ActiveJobCard
 *   jobId="123"
 *   scriptName="Daily Leads"
 *   progress={45}
 *   currentRow={450}
 *   totalRows={1000}
 *   currentBatch={2}
 *   totalBatches={5}
 *   message="Processing idiCORE enrichment..."
 *   elapsedTime={120}
 *   stats={{ clean: 380, litigator: 45, dnc: 25 }}
 *   onStop={() => {}}
 * />
 */
export function ActiveJobCard({
  jobId: _jobId,
  scriptName,
  progress,
  currentRow,
  totalRows,
  currentBatch,
  totalBatches,
  message,
  elapsedTime,
  timeRemaining,
  stats,
  onStop,
  onViewDetails,
  isStopping = false,
}: ActiveJobCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `2px solid ${palette.accent[300]}`,
        backgroundColor: palette.accent[50],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background pulse */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent 0%, ${palette.accent[100]} 50%, transparent 100%)`,
          animation: 'shimmer 2s infinite',
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Pulsing indicator */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: palette.accent[500],
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.6, transform: 'scale(1.2)' },
              },
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: palette.accent[800],
              fontSize: '0.875rem',
            }}
          >
            {scriptName}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onViewDetails && (
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={onViewDetails}
                sx={{
                  color: palette.accent[600],
                  '&:hover': { backgroundColor: palette.accent[100] },
                }}
              >
                <OpenInNew sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {onStop && (
            <Tooltip title="Stop Job">
              <IconButton
                size="small"
                onClick={onStop}
                disabled={isStopping}
                sx={{
                  color: palette.error[600],
                  '&:hover': { backgroundColor: palette.error[50] },
                }}
              >
                {isStopping ? (
                  <Refresh sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Stop sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 1.5, position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.accent[700], fontWeight: 500 }}
          >
            {message || 'Processing...'}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: palette.accent[800], fontWeight: 700 }}
          >
            {progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.accent[200],
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundColor: palette.accent[500],
            },
          }}
        />
      </Box>

      {/* Metrics grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1.5,
          position: 'relative',
        }}
      >
        {/* Rows */}
        {currentRow !== undefined && totalRows !== undefined && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.accent[600],
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Rows
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: textColors.primary,
              }}
            >
              {currentRow.toLocaleString()}/{totalRows.toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Batch */}
        {currentBatch !== undefined && totalBatches !== undefined && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.accent[600],
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Batch
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: textColors.primary,
              }}
            >
              {currentBatch}/{totalBatches}
            </Typography>
          </Box>
        )}

        {/* Elapsed */}
        {elapsedTime !== undefined && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.accent[600],
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Elapsed
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Schedule sx={{ fontSize: 12, color: palette.accent[500] }} />
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: textColors.primary,
                }}
              >
                {formatTime(elapsedTime)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* ETA */}
        {timeRemaining && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.accent[600],
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ETA
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: palette.accent[700],
              }}
            >
              {timeRemaining}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Live stats */}
      {stats && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${palette.accent[200]}`,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
            >
              Clean:{' '}
              <Box
                component="span"
                sx={{ fontWeight: 600, color: palette.success[700] }}
              >
                {stats.clean.toLocaleString()}
              </Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
            >
              Litigator:{' '}
              <Box
                component="span"
                sx={{ fontWeight: 600, color: palette.warning[700] }}
              >
                {stats.litigator.toLocaleString()}
              </Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              sx={{ color: textColors.secondary, fontSize: '0.6875rem' }}
            >
              DNC:{' '}
              <Box
                component="span"
                sx={{ fontWeight: 600, color: palette.error[700] }}
              >
                {stats.dnc.toLocaleString()}
              </Box>
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ActiveJobCard;
