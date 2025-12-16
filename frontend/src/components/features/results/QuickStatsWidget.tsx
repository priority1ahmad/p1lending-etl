/**
 * QuickStatsWidget Component
 * Compact horizontal stats widget for selected job results
 * Displays record count, clean count, litigator count, and clean percentage
 */

import { Box, Typography } from '@mui/material';
import {
  Dataset as DatasetIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { textColors, palette, borderColors } from '../../../theme';

export interface QuickStatsWidgetProps {
  recordCount: number;
  cleanCount: number;
  litigatorCount: number;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  showBorder?: boolean;
}

function StatItem({ icon, label, value, color, showBorder = true }: StatItemProps) {
  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: { xs: '50%', sm: 120 },
        textAlign: 'center',
        px: 2,
        py: { xs: 2, md: 0 },
        borderRight: showBorder
          ? { xs: 'none', md: `1px solid ${borderColors.default}` }
          : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          mb: 0.5,
        }}
      >
        <Box sx={{ color, fontSize: 18, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: textColors.secondary,
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color,
          fontSize: '1.25rem',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
}

export function QuickStatsWidget({
  recordCount,
  cleanCount,
  litigatorCount,
}: QuickStatsWidgetProps) {
  const cleanPercentage =
    recordCount > 0 ? ((cleanCount / recordCount) * 100).toFixed(1) : '0.0';

  return (
    <Card variant="default" padding="md">
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 0, md: 0 },
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <StatItem
          icon={<DatasetIcon />}
          label="Records"
          value={recordCount}
          color={palette.primary[800]}
        />
        <StatItem
          icon={<CheckCircleIcon />}
          label="Clean"
          value={cleanCount}
          color={palette.success[500]}
        />
        <StatItem
          icon={<WarningIcon />}
          label="Litigators"
          value={litigatorCount}
          color={palette.warning[500]}
        />
        <StatItem
          icon={<PieChartIcon />}
          label="Clean %"
          value={`${cleanPercentage}%`}
          color={palette.primary[700]}
          showBorder={false}
        />
      </Box>
    </Card>
  );
}

export default QuickStatsWidget;
