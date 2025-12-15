/**
 * LiveLogsPanel Component
 * Terminal-style log viewer with filtering and search
 */

import { useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility, Search, Clear } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { textColors } from '../../../theme';

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

export interface LiveLogsPanelProps {
  /** Array of log entries */
  logs: LogEntry[];
  /** Current filter value */
  filter: string;
  /** Current search value */
  search: string;
  /** Filter change handler */
  onFilterChange: (filter: string) => void;
  /** Search change handler */
  onSearchChange: (search: string) => void;
  /** View full log file click handler */
  onViewLogFile: () => void;
}

function getLogColor(level: string): string {
  switch (level) {
    case 'ERROR':
      return '#f48771';
    case 'WARNING':
      return '#cca700';
    default:
      return '#4ec9b0';
  }
}

export function LiveLogsPanel({
  logs,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onViewLogFile,
}: LiveLogsPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleFilterChange = (event: { target: { value: string } }) => {
    onFilterChange(event.target.value);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'ALL' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Card variant="default" padding="lg" sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
          }}
        >
          Live Logs
        </Typography>
        <Tooltip title="View Full Log File">
          <IconButton size="small" onClick={onViewLogFile}>
            <Visibility />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Log Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select value={filter} label="Filter" onChange={handleFilterChange}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="INFO">Info</MenuItem>
            <MenuItem value="WARNING">Warning</MenuItem>
            <MenuItem value="ERROR">Error</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search logs..."
          value={search}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ mr: 1, color: textColors.secondary }} />,
              endAdornment: search && (
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <Clear />
                </IconButton>
              ),
            },
          }}
          sx={{ flexGrow: 1, maxWidth: 300 }}
        />
      </Box>

      {/* Log Output */}
      <Paper
        sx={{
          height: 400,
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          p: 2,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '12px',
          borderRadius: 2,
        }}
      >
        {filteredLogs.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: '#858585', textAlign: 'center', mt: 4 }}
          >
            {logs.length === 0 ? 'No logs available yet' : 'No matching logs found'}
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Box
              key={index}
              sx={{
                color: getLogColor(log.level),
                mb: 0.5,
                display: 'flex',
                gap: 1,
              }}
            >
              <span style={{ color: '#858585', minWidth: '180px', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ minWidth: '80px', flexShrink: 0 }}>[{log.level}]</span>
              <span>{log.message}</span>
            </Box>
          ))
        )}
        <div ref={logsEndRef} />
      </Paper>
    </Card>
  );
}

export default LiveLogsPanel;
