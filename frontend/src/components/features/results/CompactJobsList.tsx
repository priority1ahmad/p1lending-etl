/**
 * CompactJobsList Component
 * Simple, compact job list with search filter for the redesigned results page
 */

import { useState, useMemo } from 'react';
import { Box, Typography, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { Search, Inbox, CheckCircle } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { textColors, backgrounds, borderColors, palette } from '../../../theme';

export interface CompactJob {
  job_id: string;
  job_name: string;
  record_count: number;
  last_processed: string;
}

export interface CompactJobsListProps {
  jobs: CompactJob[];
  selectedJobId: string | null;
  isLoading: boolean;
  onSelectJob: (job: CompactJob) => void;
}

export function CompactJobsList({
  jobs,
  selectedJobId,
  isLoading,
  onSelectJob,
}: CompactJobsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter jobs by search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter((job) => job.job_name.toLowerCase().includes(query));
  }, [jobs, searchQuery]);

  // Format date to be more compact
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card variant="default" padding="md" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: textColors.primary,
          mb: 2,
        }}
      >
        Jobs ({jobs.length})
      </Typography>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search jobs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: textColors.tertiary, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        fullWidth
      />

      {/* Job List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Inbox sx={{ fontSize: 40 }} />}
          title={searchQuery ? 'No Matches' : 'No Jobs'}
          description={searchQuery ? 'No jobs match your search' : 'No completed jobs found'}
          size="sm"
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {filteredJobs.map((job) => {
            const isSelected = selectedJobId === job.job_id;
            return (
              <Box
                key={job.job_id}
                onClick={() => onSelectJob(job)}
                sx={{
                  p: 1.5,
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
                {/* Job Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {isSelected && (
                    <CheckCircle sx={{ fontSize: 16, color: palette.accent[500] }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: textColors.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.job_name}
                  </Typography>
                </Box>

                {/* Record count and date */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: palette.accent[600],
                      fontWeight: 500,
                    }}
                  >
                    {job.record_count.toLocaleString()} records
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: textColors.tertiary,
                    }}
                  >
                    {formatDate(job.last_processed)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}

export default CompactJobsList;
