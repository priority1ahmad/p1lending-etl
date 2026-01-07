/**
 * ImportHistoryPanel Component
 * Displays past imports for a selected job
 */

import { useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Refresh } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import { textColors } from '../../../theme';
import type { ImportRecord } from '../../../services/api/lodasoftImport';

export interface ImportHistoryPanelProps {
  /** List of past imports */
  imports: ImportRecord[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback to refresh data */
  onRefresh: () => void;
}

const tableCellSx = {
  fontWeight: 600,
  color: textColors.primary,
  fontSize: '0.8125rem',
  py: 1.5,
};

const bodyCellSx = {
  color: textColors.secondary,
  fontSize: '0.875rem',
  py: 1.5,
};

function formatDuration(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate.getTime() - startDate.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function ImportHistoryPanel({
  imports,
  isLoading,
  onRefresh,
}: ImportHistoryPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card variant="default" padding="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 2 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: textColors.primary }}
          >
            Import History
          </Typography>
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            ({imports.length})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={expanded}>
        {imports.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: textColors.secondary, textAlign: 'center', py: 4 }}
          >
            No import history available
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableCellSx}>Status</TableCell>
                  <TableCell sx={tableCellSx}>Records</TableCell>
                  <TableCell sx={tableCellSx}>Started</TableCell>
                  <TableCell sx={tableCellSx}>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {imports.map((importRecord) => (
                  <TableRow key={importRecord.import_id} hover>
                    <TableCell>
                      <StatusBadge status={importRecord.status} showIcon />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {importRecord.records_imported.toLocaleString()} /{' '}
                      {importRecord.total_records.toLocaleString()}
                      {importRecord.records_failed > 0 && (
                        <Typography
                          component="span"
                          sx={{ color: 'error.main', fontSize: '0.75rem', ml: 1 }}
                        >
                          ({importRecord.records_failed} failed)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontSize: '0.75rem' }}>
                      {new Date(importRecord.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {formatDuration(importRecord.started_at, importRecord.completed_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Card>
  );
}

export default ImportHistoryPanel;
