/**
 * ResultsHeader Component
 * Header bar showing job name, stats, and export button
 */

import { Box, Typography, Chip } from '@mui/material';
import { Download, FiberManualRecord } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { textColors, palette } from '../../../theme';

export interface ResultsHeaderProps {
  jobName: string;
  recordCount: number;
  litigatorCount: number;
  processedDate: string;
  isExporting: boolean;
  onExport: () => void;
}

// Format date nicely
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function ResultsHeader({
  jobName,
  recordCount,
  litigatorCount,
  processedDate,
  isExporting,
  onExport,
}: ResultsHeaderProps) {
  const cleanCount = recordCount - litigatorCount;
  const cleanPercentage = recordCount > 0 ? ((cleanCount / recordCount) * 100).toFixed(1) : '0';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Left: Job Name and Stats */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
            fontSize: '1.125rem',
            mb: 0.75,
          }}
        >
          {jobName}
        </Typography>

        {/* Stats Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`${recordCount.toLocaleString()} records`}
            size="small"
            sx={{
              backgroundColor: palette.accent[50],
              color: palette.accent[700],
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', color: textColors.tertiary }}>
            <FiberManualRecord sx={{ fontSize: 6, mx: 0.5 }} />
          </Box>

          <Chip
            label={`${litigatorCount.toLocaleString()} litigators`}
            size="small"
            sx={{
              backgroundColor: palette.warning[50],
              color: palette.warning[700],
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', color: textColors.tertiary }}>
            <FiberManualRecord sx={{ fontSize: 6, mx: 0.5 }} />
          </Box>

          <Chip
            label={`${cleanPercentage}% clean`}
            size="small"
            sx={{
              backgroundColor: palette.success[50],
              color: palette.success[700],
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', color: textColors.tertiary }}>
            <FiberManualRecord sx={{ fontSize: 6, mx: 0.5 }} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: textColors.secondary,
              fontSize: '0.75rem',
            }}
          >
            {formatDate(processedDate)}
          </Typography>
        </Box>
      </Box>

      {/* Right: Export Button */}
      <Button
        variant="solid"
        colorScheme="accent"
        startIcon={<Download />}
        onClick={onExport}
        loading={isExporting}
        loadingText="Exporting..."
        size="medium"
      >
        Export CSV
      </Button>
    </Box>
  );
}

export default ResultsHeader;
