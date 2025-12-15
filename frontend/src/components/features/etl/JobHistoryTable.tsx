/**
 * JobHistoryTable Component
 * Displays recent ETL jobs and preview history in a data table
 */

import { Box, Typography, Chip } from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { History, Visibility } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import type { JobStatus } from '../../ui/Badge/StatusBadge';
import { textColors, backgrounds, borderColors, palette } from '../../../theme';

export interface JobHistoryItem {
  id: string;
  job_type: 'preview' | 'single_script' | 'combined_scripts';
  script_id?: string;
  status: string;
  row_limit?: number;
  total_rows_processed?: number;
  litigator_count?: number;
  dnc_count?: number;
  both_count?: number;
  clean_count?: number;
  started_at?: string;
  created_at?: string;
}

export interface Script {
  id: string;
  name: string;
}

export interface JobHistoryTableProps {
  /** List of jobs */
  jobs: JobHistoryItem[];
  /** Available scripts for name lookup */
  scripts: Script[];
  /** Optional message about job history */
  message?: string;
  /** View preview click handler */
  onViewPreview: (job: JobHistoryItem) => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const tableCellSx = {
  fontWeight: 600,
  color: textColors.primary,
  fontSize: '0.8125rem',
  py: 1.5,
};

const bodyCellSx = {
  color: textColors.secondary,
  fontSize: '0.875rem',
  py: 1.5,
};

export function JobHistoryTable({
  jobs,
  scripts,
  message,
  onViewPreview,
}: JobHistoryTableProps) {
  const getScriptName = (scriptId?: string) => {
    if (!scriptId) return 'Unknown Script';
    const script = scripts.find((s) => s.id === scriptId);
    return script?.name || 'Unknown Script';
  };

  return (
    <Card variant="default" padding="lg" sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <History sx={{ color: palette.accent[500] }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
          }}
        >
          Run History
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{
          mb: 2,
          color: textColors.secondary,
        }}
      >
        View all preview requests and ETL job runs. Click on a preview to view details.
      </Typography>

      {message && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: backgrounds.secondary,
            borderRadius: 1,
            border: `1px solid ${borderColors.default}`,
          }}
        >
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            {message}
          </Typography>
        </Box>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={<History sx={{ fontSize: 48 }} />}
          title="No Job History"
          description="Run a preview or start an ETL job to see history."
          size="md"
        />
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={tableCellSx}>Type</TableCell>
                <TableCell sx={tableCellSx}>Script</TableCell>
                <TableCell sx={tableCellSx}>Status</TableCell>
                <TableCell sx={tableCellSx}>Processed</TableCell>
                <TableCell sx={{ ...tableCellSx, textAlign: 'center' }}>Litigator</TableCell>
                <TableCell sx={{ ...tableCellSx, textAlign: 'center' }}>DNC</TableCell>
                <TableCell sx={{ ...tableCellSx, textAlign: 'center' }}>Both</TableCell>
                <TableCell sx={{ ...tableCellSx, textAlign: 'center' }}>Clean</TableCell>
                <TableCell sx={tableCellSx}>Started</TableCell>
                <TableCell sx={tableCellSx}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => {
                const isPreview = job.job_type === 'preview';
                const isCompleted = job.status === 'completed';

                return (
                  <TableRow
                    key={job.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: backgrounds.secondary,
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={isPreview ? 'Preview' : 'ETL Run'}
                        size="small"
                        sx={{
                          backgroundColor: isPreview ? palette.accent[500] : palette.primary[800],
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{getScriptName(job.script_id)}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status as JobStatus} size="small" />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {job.row_limit
                        ? `${(job.total_rows_processed || 0).toLocaleString()}/${job.row_limit.toLocaleString()}`
                        : (job.total_rows_processed || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {!isPreview && isCompleted ? job.litigator_count || 0 : '-'}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {!isPreview && isCompleted ? job.dnc_count || 0 : '-'}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {!isPreview && isCompleted ? job.both_count || 0 : '-'}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      {!isPreview && isCompleted ? job.clean_count || 0 : '-'}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontSize: '0.8125rem' }}>
                      {formatDate(job.started_at || job.created_at)}
                    </TableCell>
                    <TableCell>
                      {isPreview && isCompleted && (
                        <Button
                          variant="ghost"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => onViewPreview(job)}
                          sx={{ color: palette.accent[500] }}
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
    </Card>
  );
}

export default JobHistoryTable;
