/**
 * QuickStatsWidget Component
 * Compact horizontal stats widget for selected job results
 * Displays record count, clean count, litigator count, and clean percentage
 */

import { Box, Typography } from '@mui/material';
import { Card } from '../../ui/Card/Card';
import { textColors, palette, borderColors } from '../../../theme';

export interface QuickStatsWidgetProps {
  recordCount: number;
  cleanCount: number;
  litigatorCount: number;
}

interface StatItemProps {
  label: string;
  value: string | number;
  color: string;
  showBorder?: boolean;
}

function StatItem({ label, value, color, showBorder = true }: StatItemProps) {
  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: { xs: '50%', sm: 100 },
        textAlign: 'center',
        px: 1.5,
        py: { xs: 1, md: 0 },
        borderRight: showBorder
          ? { xs: 'none', md: `1px solid ${borderColors.default}` }
          : 'none',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: textColors.secondary,
          fontWeight: 500,
          fontSize: '0.6875rem',
          display: 'block',
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color,
          fontSize: '1rem',
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
    <Card variant="default" padding="sm">
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
          label="Records"
          value={recordCount}
          color={palette.primary[800]}
        />
        <StatItem
          label="Clean"
          value={cleanCount}
          color={palette.success[500]}
        />
        <StatItem
          label="Litigators"
          value={litigatorCount}
          color={palette.warning[500]}
        />
        <StatItem
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
