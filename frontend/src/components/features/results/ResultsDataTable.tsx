/**
 * ResultsDataTable Component
 * Paginated data table for ETL results with filtering and export
 * Optimized with virtualization for large datasets
 */

import { useRef, memo } from 'react';
import type { ChangeEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { ImportButton } from '../import';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import { textColors } from '../../../theme';

export interface ResultRecord {
  record_id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_1?: string;
  email_1?: string;
  in_litigator_list: string;
  processed_at: string;
}

export interface ResultsDataTableProps {
  jobName: string;
  records: ResultRecord[];
  total: number;
  litigatorCount?: number;
  excludeLitigators: boolean;
  currentPage: number;
  recordsPerPage: number;
  isLoading: boolean;
  isExporting: boolean;
  isImporting?: boolean;
  onImport: () => void;
  onToggleExclude: (exclude: boolean) => void;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (perPage: number) => void;
  onExport: () => void;
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

export const ResultsDataTable = memo(function ResultsDataTable({
  jobName,
  records,
  total,
  excludeLitigators,
  currentPage,
  recordsPerPage,
  isLoading,
  isExporting,
  onToggleExclude,
  onPageChange,
  onRecordsPerPageChange,
  onExport,
  onImport,
  isImporting = false,
}: ResultsDataTableProps) {
  const totalPages = Math.ceil(total / recordsPerPage);
  const parentRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  // Virtualization setup
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is properly memoized
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Approximate row height in pixels
    overscan: 5, // Render 5 extra rows above and below viewport
  });

  return (
    <Card variant="default" padding="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: textColors.primary,
          }}
        >
          {jobName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={excludeLitigators}
                onChange={(e) => onToggleExclude(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: textColors.secondary }}>
                Exclude Litigators
              </Typography>
            }
          />
          <ImportButton
            onImport={onImport}
            onExport={onExport}
            isImporting={isImporting}
            isExporting={isExporting}
          />
        </Box>
      </Box>

      {/* Results info */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per Page</InputLabel>
          <Select
            value={recordsPerPage}
            label="Per Page"
            onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
          >
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={200}>200</MenuItem>
            <MenuItem value={500}>500</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<TableChart sx={{ fontSize: 48 }} />}
          title="No Results"
          description="No results found for this job"
          size="md"
        />
      ) : (
        <>
          <TableContainer ref={parentRef} sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableCellSx}>Name</TableCell>
                  <TableCell sx={tableCellSx}>Address</TableCell>
                  <TableCell sx={tableCellSx}>City</TableCell>
                  <TableCell sx={tableCellSx}>State</TableCell>
                  <TableCell sx={tableCellSx}>Zip</TableCell>
                  <TableCell sx={tableCellSx}>Phone 1</TableCell>
                  <TableCell sx={tableCellSx}>Email 1</TableCell>
                  <TableCell sx={tableCellSx}>Litigator</TableCell>
                  <TableCell sx={tableCellSx}>Processed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                sx={{
                  position: 'relative',
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const record = records[virtualRow.index];
                  return (
                    <TableRow
                      key={record.record_id}
                      hover
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableCell sx={bodyCellSx}>
                        {record.first_name} {record.last_name}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{record.address}</TableCell>
                      <TableCell sx={bodyCellSx}>{record.city}</TableCell>
                      <TableCell sx={bodyCellSx}>{record.state}</TableCell>
                      <TableCell sx={bodyCellSx}>{record.zip_code}</TableCell>
                      <TableCell sx={bodyCellSx}>{record.phone_1 || '-'}</TableCell>
                      <TableCell sx={bodyCellSx}>{record.email_1 || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={record.in_litigator_list === 'Yes' ? 'litigator' : 'clean'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontSize: '0.75rem' }}>
                        {new Date(record.processed_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Card>
  );
});

export default ResultsDataTable;
