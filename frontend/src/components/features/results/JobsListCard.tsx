/**
 * JobsListCard Component
 * Compact selectable list of jobs with results
 */

import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { Inbox } from '@mui/icons-material';
import { textColors, backgrounds, borderColors, palette } from '../../../theme';

export interface JobItem {
  job_id: string;
  job_name: string;
  record_count: number;
  litigator_count: number;
  dnc_count?: number;
  both_count?: number;
  last_processed: string;
  table_id?: string;
  table_title?: string;
}

export interface JobsListCardProps {
  jobs: JobItem[];
  selectedJobId: string;
  totalJobs: number;
  isLoading: boolean;
  onSelectJob: (job: JobItem) => void;
}

export function JobsListCard({
  jobs,
  selectedJobId,
  totalJobs,
  isLoading,
  onSelectJob,
}: JobsListCardProps) {
  return (
    <Card
      title={`Jobs with Results (${totalJobs})`}
      variant="default"
      padding="lg"
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Inbox sx={{ fontSize: 48 }} />}
          title="No Jobs Found"
          description="No jobs with results found"
          size="sm"
        />
      ) : (
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {jobs.map((job) => {
            const isSelected = selectedJobId === job.job_id;
            return (
              <Box
                key={job.job_id}
                onClick={() => onSelectJob(job)}
                sx={{
                  p: 2,
                  mb: 1.5,
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: isSelected
                    ? `2px solid ${palette.accent[500]}`
                    : `1px solid ${borderColors.default}`,
                  backgroundColor: isSelected ? palette.accent[50] : backgrounds.primary,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? palette.accent[50] : backgrounds.secondary,
                    borderColor: isSelected ? palette.accent[500] : borderColors.strong,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: textColors.primary,
                    mb: 0.5,
                  }}
                >
                  {job.table_title || job.job_name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: textColors.tertiary,
                    mb: 1,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {job.job_id.substring(0, 8)}...
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    label={`${job.record_count.toLocaleString()} records`}
                    size="small"
                    sx={{
                      backgroundColor: palette.accent[100],
                      color: palette.accent[700],
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={`${job.litigator_count.toLocaleString()} litigators`}
                    size="small"
                    sx={{
                      backgroundColor: palette.warning[100],
                      color: palette.warning[700],
                      fontWeight: 500,
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: textColors.secondary,
                  }}
                >
                  {new Date(job.last_processed).toLocaleString()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}

export default JobsListCard;
