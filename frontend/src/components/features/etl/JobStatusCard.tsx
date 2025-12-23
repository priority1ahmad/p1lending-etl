/**
 * JobStatusCard Component
 * Displays current job status with progress bar and detailed metrics
 */

import { Box, Typography, LinearProgress, Grid } from '@mui/material';
import { Stop, Visibility } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import type { JobStatus } from '../../ui/Badge/StatusBadge';
import { textColors, backgrounds } from '../../../theme';

export interface JobData {
  id: string;
  status: string;
  progress: number;
  message?: string;
  current_row?: number;
  total_rows?: number;
  rows_remaining?: number;
  current_batch?: number;
  total_batches?: number;
}

export interface JobStatusCardProps {
  /** Current job data */
  job: JobData;
  /** Is cancel mutation pending */
  isCancelLoading: boolean;
  /** Cancel button click handler */
  onCancel: () => void;
  /** View log file button click handler */
  onViewLogFile: () => void;
}

export function JobStatusCard({
  job,
  isCancelLoading,
  onCancel,
  onViewLogFile,
}: JobStatusCardProps) {
  const isRunning = job.status === 'running';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const showProgressDetails = job.total_rows !== undefined || job.current_batch !== undefined;

  return (
    <Card variant="default" padding="lg" sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
          }}
        >
          Job Status
        </Typography>
        <StatusBadge status={job.status as JobStatus} />
      </Box>

      {isRunning && (
        <>
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={job.progress}
              sx={{
                mb: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: backgrounds.tertiary,
              }}
            />
            <Typography variant="body2" sx={{ color: textColors.secondary }}>
              {job.progress}% - {job.message || 'Processing...'}
            </Typography>
          </Box>

          {showProgressDetails && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: backgrounds.secondary,
                borderRadius: 2,
              }}
            >
              <Grid container spacing={2}>
                {job.total_rows !== undefined && (
                  <>
                    {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" sx={{ color: textColors.secondary, mb: 0.5 }}>
                        Rows Processed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {job.current_row || 0} / {job.total_rows}
                      </Typography>
                    </Grid>
                    {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" sx={{ color: textColors.secondary, mb: 0.5 }}>
                        Rows Remaining
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {job.rows_remaining || 0}
                      </Typography>
                    </Grid>
                    {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" sx={{ color: textColors.secondary, mb: 0.5 }}>
                        Percentage
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {job.progress}%
                      </Typography>
                    </Grid>
                    {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" sx={{ color: textColors.secondary, mb: 0.5 }}>
                        Batch
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {job.current_batch || 0} / {job.total_batches || 0}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}

          <Button
            variant="outline"
            colorScheme="error"
            startIcon={<Stop />}
            onClick={onCancel}
            disabled={isCancelLoading}
            loading={isCancelLoading}
            loadingText="Stopping..."
          >
            Stop Job
          </Button>
        </>
      )}

      {job.message && !isRunning && job.status !== 'completed' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: textColors.secondary }}>
            {job.message}
          </Typography>
          {(isFailed || isCancelled) && (
            <Button
              variant="outline"
              startIcon={<Visibility />}
              onClick={onViewLogFile}
              size="small"
            >
              View Log File
            </Button>
          )}
        </Box>
      )}
    </Card>
  );
}

export default JobStatusCard;
