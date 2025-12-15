/**
 * ResultsDataTable Component
 * Paginated data table for ETL results with filtering and export
 */

import type { ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Chip,
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
import { Download, TableChart } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import { textColors, palette } from '../../../theme';

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

export function ResultsDataTable({
  jobName,
  records,
  total,
  litigatorCount,
  excludeLitigators,
  currentPage,
  recordsPerPage,
  isLoading,
  isExporting,
  onToggleExclude,
  onPageChange,
  onRecordsPerPageChange,
  onExport,
}: ResultsDataTableProps) {
  const totalPages = Math.ceil(total / recordsPerPage);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

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
          <Button
            variant="solid"
            colorScheme="accent"
            startIcon={<Download />}
            onClick={onExport}
            loading={isExporting}
            loadingText="Exporting..."
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Results info */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Chip
          label={`Total: ${total.toLocaleString()} records`}
          size="small"
          sx={{
            backgroundColor: palette.accent[100],
            color: palette.accent[700],
            fontWeight: 500,
          }}
        />
        {litigatorCount !== undefined && (
          <Chip
            label={`Litigators: ${litigatorCount.toLocaleString()}`}
            size="small"
            sx={{
              backgroundColor: palette.warning[100],
              color: palette.warning[700],
              fontWeight: 500,
            }}
          />
        )}
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
          <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
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
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.record_id} hover>
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
                ))}
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
}

export default ResultsDataTable;
