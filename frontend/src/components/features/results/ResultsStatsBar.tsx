/**
 * ResultsStatsBar Component
 * Horizontal statistics bar for ETL results overview
 */

import { Box, Typography } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { textColors, palette, borderColors } from '../../../theme';

export interface ResultsStats {
  total_jobs: number;
  total_records: number;
  clean_records: number;
  total_litigators: number;
  litigator_percentage: number | string;
}

export interface ResultsStatsBarProps {
  stats: ResultsStats;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  suffix?: string;
  showBorder?: boolean;
}

function StatItem({ icon, label, value, color, suffix, showBorder = true }: StatItemProps) {
  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: 150,
        textAlign: 'center',
        px: 2,
        borderRight: showBorder ? { xs: 'none', md: `1px solid ${borderColors.default}` } : 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color, fontSize: 20 }}>{icon}</Box>
        <Typography
          variant="body2"
          sx={{
            color: textColors.secondary,
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && (
          <Typography
            component="span"
            sx={{
              ml: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: textColors.secondary,
            }}
          >
            {suffix}
          </Typography>
        )}
      </Typography>
    </Box>
  );
}

export function ResultsStatsBar({ stats }: ResultsStatsBarProps) {
  return (
    <Card variant="default" padding="md">
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 3, md: 0 },
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <StatItem
          icon={<Assessment />}
          label="Total Jobs"
          value={stats.total_jobs}
          color={palette.primary[800]}
        />
        <StatItem
          icon={<Assessment />}
          label="Total Records"
          value={stats.total_records}
          color={palette.accent[500]}
        />
        <StatItem
          icon={<Assessment />}
          label="Clean Records"
          value={stats.clean_records}
          color={palette.success[500]}
        />
        <StatItem
          icon={<Assessment />}
          label="Litigators"
          value={stats.total_litigators}
          color={palette.warning[500]}
          suffix={`(${stats.litigator_percentage}%)`}
          showBorder={false}
        />
      </Box>
    </Card>
  );
}

export default ResultsStatsBar;
