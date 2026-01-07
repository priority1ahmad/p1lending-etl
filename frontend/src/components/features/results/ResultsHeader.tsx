/**
 * ResultsHeader Component
 * Header bar showing job name, stats, and import/export buttons
 */

import { Box, Typography, Chip } from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import { ImportButton } from '../import';
import { textColors, palette } from '../../../theme';

export interface ResultsHeaderProps {
  jobName: string;
  recordCount: number;
  litigatorCount: number;
  processedDate: string;
  isExporting: boolean;
  isImporting?: boolean;
  onExport: () => void;
  onImport: () => void;
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
  processedDate,
  isExporting,
  isImporting = false,
  onExport,
  onImport,
}: ResultsHeaderProps) {

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

      {/* Right: Import/Export Button */}
      <ImportButton
        onImport={onImport}
        onExport={onExport}
        isImporting={isImporting}
        isExporting={isExporting}
      />
    </Box>
  );
}

export default ResultsHeader;
