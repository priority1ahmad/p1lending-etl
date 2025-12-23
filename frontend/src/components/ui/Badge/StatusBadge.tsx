/**
 * StatusBadge Component
 * Clean status indicators for jobs, compliance, etc.
 */

import { forwardRef } from 'react';
import { Chip, type ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { palette } from '../../../theme';
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmber,
  Schedule,
  Cancel,
  PlayArrow,
} from '@mui/icons-material';

// Status types
export type JobStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'pending';
export type ComplianceStatus = 'clean' | 'litigator' | 'dnc' | 'both';

export interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  /** Status value */
  status: JobStatus | ComplianceStatus | string;
  /** Show icon */
  showIcon?: boolean;
  /** Custom label (overrides default status label) */
  label?: string;
}

// Status configurations
const statusConfig: Record<
  string,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ReactElement;
  }
> = {
  // Job statuses
  running: {
    label: 'Running',
    bgColor: palette.accent[50],
    textColor: palette.accent[700],
    borderColor: palette.accent[200],
    icon: <PlayArrow fontSize="small" />,
  },
  completed: {
    label: 'Completed',
    bgColor: palette.success[50],
    textColor: palette.success[700],
    borderColor: palette.success[200],
    icon: <CheckCircleOutline fontSize="small" />,
  },
  failed: {
    label: 'Failed',
    bgColor: palette.error[50],
    textColor: palette.error[700],
    borderColor: palette.error[200],
    icon: <ErrorOutline fontSize="small" />,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: palette.gray[100],
    textColor: palette.gray[600],
    borderColor: palette.gray[200],
    icon: <Cancel fontSize="small" />,
  },
  pending: {
    label: 'Pending',
    bgColor: palette.warning[50],
    textColor: palette.warning[700],
    borderColor: palette.warning[200],
    icon: <Schedule fontSize="small" />,
  },
  // Compliance statuses
  clean: {
    label: 'Clean',
    bgColor: palette.success[50],
    textColor: palette.success[700],
    borderColor: palette.success[200],
    icon: <CheckCircleOutline fontSize="small" />,
  },
  litigator: {
    label: 'Litigator',
    bgColor: palette.error[50],
    textColor: palette.error[700],
    borderColor: palette.error[200],
    icon: <ErrorOutline fontSize="small" />,
  },
  dnc: {
    label: 'DNC',
    bgColor: palette.warning[50],
    textColor: palette.warning[700],
    borderColor: palette.warning[200],
    icon: <WarningAmber fontSize="small" />,
  },
  both: {
    label: 'Both',
    bgColor: palette.error[100],
    textColor: palette.error[800],
    borderColor: palette.error[300],
    icon: <ErrorOutline fontSize="small" />,
  },
};

// Default config for unknown statuses
const defaultConfig = {
  label: 'Unknown',
  bgColor: palette.gray[100],
  textColor: palette.gray[600],
  borderColor: palette.gray[200],
  icon: <Schedule fontSize="small" />,
};

const StyledChip = styled(Chip, {
  shouldForwardProp: (prop) =>
    !['bgColor', 'textColor', 'borderColor'].includes(prop as string),
})<{
  bgColor: string;
  textColor: string;
  borderColor: string;
}>(({ bgColor, textColor, borderColor }) => ({
  backgroundColor: bgColor,
  color: textColor,
  border: `1px solid ${borderColor}`,
  borderRadius: 6,
  fontWeight: 500,
  fontSize: '0.75rem',
  height: 24,
  '& .MuiChip-icon': {
    color: textColor,
    marginLeft: 6,
    marginRight: -2,
  },
  '& .MuiChip-label': {
    paddingLeft: 8,
    paddingRight: 8,
  },
}));

/**
 * StatusBadge for displaying job and compliance statuses
 *
 * @example
 * // Job status
 * <StatusBadge status="running" />
 * <StatusBadge status="completed" showIcon />
 *
 * // Compliance status
 * <StatusBadge status="clean" />
 * <StatusBadge status="litigator" showIcon />
 *
 * // Custom label
 * <StatusBadge status="completed" label="Done" />
 */
export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showIcon = false, label, size = 'small', ...props }, ref) => {
    const config = statusConfig[status.toLowerCase()] || {
      ...defaultConfig,
      label: status,
    };

    return (
      <StyledChip
        ref={ref}
        label={label || config.label}
        icon={showIcon ? config.icon : undefined}
        bgColor={config.bgColor}
        textColor={config.textColor}
        borderColor={config.borderColor}
        size={size}
        {...props}
      />
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
