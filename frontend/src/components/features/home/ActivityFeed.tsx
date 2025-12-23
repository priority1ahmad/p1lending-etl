/**
 * ActivityFeed Component
 * Real-time activity log for ETL job processing
 * Shows timestamped events with icons and severity levels
 */

import { useEffect, useRef } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Storage,
  CloudUpload,
  Phone,
  Gavel,
  Block,
  Speed,
  PlayArrow,
  Stop,
} from '@mui/icons-material';
import { palette, textColors, backgrounds, borderColors } from '../../../theme';

export type ActivityType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'snowflake'
  | 'idicore'
  | 'ccc'
  | 'dnc'
  | 'upload'
  | 'batch'
  | 'start'
  | 'stop';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  details?: string;
  count?: number;
}

export interface ActivityFeedProps {
  /** List of activity items */
  activities: ActivityItem[];
  /** Maximum height before scrolling */
  maxHeight?: number;
  /** Auto-scroll to bottom on new items */
  autoScroll?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Title for the feed */
  title?: string;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Compact mode (smaller text/spacing) */
  compact?: boolean;
}

const ICON_MAP: Record<ActivityType, React.ReactNode> = {
  info: <Info sx={{ fontSize: 16 }} />,
  success: <CheckCircle sx={{ fontSize: 16 }} />,
  warning: <Warning sx={{ fontSize: 16 }} />,
  error: <Error sx={{ fontSize: 16 }} />,
  snowflake: <Storage sx={{ fontSize: 16 }} />,
  idicore: <Phone sx={{ fontSize: 16 }} />,
  ccc: <Gavel sx={{ fontSize: 16 }} />,
  dnc: <Block sx={{ fontSize: 16 }} />,
  upload: <CloudUpload sx={{ fontSize: 16 }} />,
  batch: <Speed sx={{ fontSize: 16 }} />,
  start: <PlayArrow sx={{ fontSize: 16 }} />,
  stop: <Stop sx={{ fontSize: 16 }} />,
};

const COLOR_MAP: Record<ActivityType, string> = {
  info: palette.accent[500],
  success: palette.success[500],
  warning: palette.warning[500],
  error: palette.error[500],
  snowflake: '#29B5E8', // Snowflake brand blue
  idicore: palette.accent[600],
  ccc: palette.warning[600],
  dnc: palette.gray[500], // DNC is a compliance flag, not an error
  upload: palette.success[600],
  batch: palette.accent[500],
  start: palette.success[500],
  stop: palette.error[500],
};

const BG_COLOR_MAP: Record<ActivityType, string> = {
  info: palette.accent[50],
  success: palette.success[50],
  warning: palette.warning[50],
  error: palette.error[50],
  snowflake: '#E6F7FC',
  idicore: palette.accent[50],
  ccc: palette.warning[50],
  dnc: palette.gray[50], // DNC is a compliance flag, not an error
  upload: palette.success[50],
  batch: palette.accent[50],
  start: palette.success[50],
  stop: palette.error[50],
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function ActivityItemRow({
  item,
  showTimestamp,
  compact,
}: {
  item: ActivityItem;
  showTimestamp: boolean;
  compact: boolean;
}) {
  const color = COLOR_MAP[item.type];
  const bgColor = BG_COLOR_MAP[item.type];
  const icon = ICON_MAP[item.type];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 1 : 1.5,
        py: compact ? 0.75 : 1,
        px: compact ? 1 : 1.5,
        borderRadius: 1,
        backgroundColor: bgColor,
        border: `1px solid ${color}20`,
        transition: 'all 0.2s ease',
        animation: 'fadeSlideIn 0.3s ease-out',
        '@keyframes fadeSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-8px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {icon}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: textColors.primary,
              fontSize: compact ? '0.75rem' : '0.8125rem',
              fontWeight: 500,
              flex: 1,
            }}
          >
            {item.message}
            {item.count !== undefined && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 0.5,
                  backgroundColor: color,
                  color: '#fff',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                }}
              >
                {item.count.toLocaleString()}
              </Box>
            )}
          </Typography>

          {showTimestamp && (
            <Typography
              variant="caption"
              sx={{
                color: textColors.tertiary,
                fontSize: '0.625rem',
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              {formatTime(item.timestamp)}
            </Typography>
          )}
        </Box>

        {item.details && (
          <Typography
            variant="caption"
            sx={{
              color: textColors.secondary,
              fontSize: compact ? '0.6875rem' : '0.75rem',
              display: 'block',
              mt: 0.25,
            }}
          >
            {item.details}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function LoadingSkeleton({ compact }: { compact: boolean }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: compact ? 0.75 : 1,
            px: compact ? 1 : 1.5,
          }}
        >
          <Skeleton variant="circular" width={16} height={16} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={`${70 + (i * 7) % 30}%`} height={16} />
          </Box>
          <Skeleton variant="text" width={50} height={12} />
        </Box>
      ))}
    </Box>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: textColors.secondary,
      }}
    >
      <Info sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        No activity yet
      </Typography>
      <Typography variant="caption" sx={{ color: textColors.tertiary }}>
        Activity will appear here when a job starts
      </Typography>
    </Box>
  );
}

/**
 * Real-time activity feed for ETL job monitoring
 */
export function ActivityFeed({
  activities,
  maxHeight = 300,
  autoScroll = true,
  isLoading = false,
  title = 'Activity Feed',
  showTimestamps = true,
  compact = false,
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && activities.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities.length, autoScroll]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${borderColors.default}`,
        backgroundColor: backgrounds.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: compact ? 1.5 : 2,
          py: compact ? 1 : 1.5,
          borderBottom: `1px solid ${borderColors.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: backgrounds.secondary,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: activities.length > 0 ? palette.success[500] : palette.gray[300],
              animation: activities.length > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: textColors.primary,
              fontSize: compact ? '0.75rem' : '0.8125rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: textColors.tertiary,
            fontSize: '0.6875rem',
          }}
        >
          {activities.length} events
        </Typography>
      </Box>

      {/* Activity list */}
      <Box
        ref={scrollRef}
        sx={{
          maxHeight,
          overflowY: 'auto',
          p: compact ? 1 : 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 0.5 : 0.75,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: backgrounds.secondary,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: borderColors.default,
            borderRadius: 3,
            '&:hover': {
              backgroundColor: borderColors.strong,
            },
          },
        }}
      >
        {isLoading ? (
          <LoadingSkeleton compact={compact} />
        ) : activities.length === 0 ? (
          <EmptyState />
        ) : (
          activities.map((item) => (
            <ActivityItemRow
              key={item.id}
              item={item}
              showTimestamp={showTimestamps}
              compact={compact}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export default ActivityFeed;
