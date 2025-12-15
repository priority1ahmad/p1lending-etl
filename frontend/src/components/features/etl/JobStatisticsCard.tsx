/**
 * JobStatisticsCard Component
 * Displays completion metrics for a finished ETL job
 */

import { Box, Typography, Grid } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { textColors, palette } from '../../../theme';

export interface JobStatistics {
  total_rows_processed?: number;
  litigator_count?: number;
  dnc_count?: number;
  both_count?: number;
  clean_count?: number;
}

export interface JobStatisticsCardProps {
  /** Job statistics data */
  statistics: JobStatistics;
  /** View log file button click handler */
  onViewLogFile: () => void;
}

interface StatItemProps {
  label: string;
  value: number;
  color?: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    // @ts-ignore - MUI v7 Grid item prop works at runtime
    <Grid item xs={12} sm={6} md={2.4}>
      <Typography variant="body2" sx={{ color: textColors.secondary, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: color || textColors.primary,
        }}
      >
        {(value || 0).toLocaleString()}
      </Typography>
    </Grid>
  );
}

export function JobStatisticsCard({
  statistics,
  onViewLogFile,
}: JobStatisticsCardProps) {
  return (
    <Card variant="default" padding="lg" sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
          }}
        >
          Statistics
        </Typography>
        <Button
          variant="outline"
          startIcon={<Visibility />}
          onClick={onViewLogFile}
        >
          View Log File
        </Button>
      </Box>

      <Grid container spacing={2}>
        <StatItem
          label="Total Processed"
          value={statistics.total_rows_processed || 0}
        />
        <StatItem
          label="Litigator Count"
          value={statistics.litigator_count || 0}
          color={palette.error[500]}
        />
        <StatItem
          label="DNC Count"
          value={statistics.dnc_count || 0}
          color={palette.warning[500]}
        />
        <StatItem
          label="Both Count"
          value={statistics.both_count || 0}
          color={palette.error[500]}
        />
        <StatItem
          label="Clean Count"
          value={statistics.clean_count || 0}
          color={palette.success[500]}
        />
      </Grid>
    </Card>
  );
}

export default JobStatisticsCard;
