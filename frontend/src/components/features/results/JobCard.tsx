/**
 * JobCard Component
 * Compact card for displaying a job in the sidebar
 * Airtable-inspired design with clean hover/selected states
 */

import { Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { textColors, palette } from '../../../theme';

export interface JobCardProps {
  jobId: string;
  jobName: string;
  recordCount: number;
  lastProcessed: string;
  isSelected: boolean;
  onClick: () => void;
}

// Format large numbers (15420 -> "15.4K")
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

// Format date compactly (Dec 22)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export function JobCard({
  jobName,
  recordCount,
  lastProcessed,
  isSelected,
  onClick,
}: JobCardProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        borderRadius: 0,
        border: isSelected
          ? `2px solid ${palette.accent[500]}`
          : '1px solid #e5e7eb',
        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
        transition: 'all 0.15s ease',
        boxShadow: isSelected
          ? '0 1px 3px rgba(59, 130, 246, 0.1)'
          : '0 1px 2px rgba(0, 0, 0, 0.05)',
        '&:hover': {
          backgroundColor: isSelected ? '#eff6ff' : '#f9fafb',
          borderColor: isSelected ? palette.accent[500] : '#d1d5db',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* Job Name Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        {isSelected && (
          <CheckCircle sx={{ fontSize: 14, color: palette.accent[500], flexShrink: 0 }} />
        )}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.8125rem',
          }}
        >
          {jobName}
        </Typography>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.accent[600],
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        >
          {formatCount(recordCount)} records
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: textColors.tertiary,
            fontSize: '0.6875rem',
          }}
        >
          {formatDate(lastProcessed)}
        </Typography>
      </Box>
    </Box>
  );
}

export default JobCard;
