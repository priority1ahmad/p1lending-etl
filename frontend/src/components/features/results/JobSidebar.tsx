/**
 * JobSidebar Component
 * Collapsible sidebar with search and job cards
 * Airtable-inspired design
 */

import { useState, useMemo } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Search, ChevronLeft, ChevronRight, Inbox } from '@mui/icons-material';
import { JobCard } from './JobCard';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { textColors } from '../../../theme';

export interface SidebarJob {
  job_id: string;
  job_name: string;
  record_count: number;
  last_processed: string;
}

export interface JobSidebarProps {
  jobs: SidebarJob[];
  selectedJobId: string | null;
  isLoading: boolean;
  isCollapsed: boolean;
  onSelectJob: (job: SidebarJob) => void;
  onToggleCollapse: () => void;
}

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 48;

export function JobSidebar({
  jobs,
  selectedJobId,
  isLoading,
  isCollapsed,
  onSelectJob,
  onToggleCollapse,
}: JobSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter jobs by search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter((job) => job.job_name.toLowerCase().includes(query));
  }, [jobs, searchQuery]);

  // Collapsed state - just show expand button
  if (isCollapsed) {
    return (
      <Box
        sx={{
          width: COLLAPSED_WIDTH,
          minWidth: COLLAPSED_WIDTH,
          height: '100%',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          transition: 'width 0.2s ease',
        }}
      >
        <IconButton
          onClick={onToggleCollapse}
          size="small"
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
          }}
        >
          <ChevronRight sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: textColors.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.6875rem',
            mb: 1.5,
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
                <Search sx={{ color: textColors.tertiary, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
            },
          }}
        />
      </Box>

      {/* Job List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Inbox sx={{ fontSize: 36 }} />}
            title={searchQuery ? 'No Matches' : 'No Jobs'}
            description={searchQuery ? 'Try a different search' : 'No completed jobs found'}
            size="sm"
          />
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.job_id}
              jobId={job.job_id}
              jobName={job.job_name}
              recordCount={job.record_count}
              lastProcessed={job.last_processed}
              isSelected={selectedJobId === job.job_id}
              onClick={() => onSelectJob(job)}
            />
          ))
        )}
      </Box>

      {/* Collapse Button */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <IconButton
          onClick={onToggleCollapse}
          size="small"
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 1.5,
            px: 2,
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
          }}
        >
          <ChevronLeft sx={{ fontSize: 16, mr: 0.5 }} />
          <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: textColors.secondary }}>
            Collapse
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );
}

export default JobSidebar;
