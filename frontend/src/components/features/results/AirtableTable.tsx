/**
 * AirtableTable Component
 * Clean, Airtable-inspired data table with all columns
 * Features: sticky header, zebra striping, horizontal scroll
 */

import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import { TableChart } from '@mui/icons-material';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import { EmptyState } from '../../ui/Feedback/EmptyState';
import { textColors } from '../../../theme';

export interface TableRecord {
  record_id: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;
  email_1?: string;
  email_2?: string;
  email_3?: string;
  in_litigator_list?: string;
  processed_at: string;
}

export interface AirtableTableProps {
  records: TableRecord[];
  isLoading: boolean;
}

// Table columns configuration
const columns = [
  { key: 'name', label: 'Name', width: 160 },
  { key: 'address', label: 'Address', width: 200 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'state', label: 'State', width: 60 },
  { key: 'zip', label: 'Zip', width: 80 },
  { key: 'phone_1', label: 'Phone 1', width: 130 },
  { key: 'phone_2', label: 'Phone 2', width: 130 },
  { key: 'phone_3', label: 'Phone 3', width: 130 },
  { key: 'email_1', label: 'Email 1', width: 180 },
  { key: 'email_2', label: 'Email 2', width: 180 },
  { key: 'email_3', label: 'Email 3', width: 180 },
  { key: 'litigator', label: 'Status', width: 90 },
  { key: 'processed', label: 'Processed', width: 100 },
];

const headerCellSx = {
  fontWeight: 600,
  color: textColors.secondary,
  fontSize: '0.75rem',
  py: 1.5,
  px: 1.5,
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const bodyCellSx = {
  color: textColors.primary,
  fontSize: '0.8125rem',
  py: 1.25,
  px: 1.5,
  borderBottom: '1px solid #f3f4f6',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

// Format date compactly
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const AirtableTable = memo(function AirtableTable({
  records,
  isLoading,
}: AirtableTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for performance
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (records.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <EmptyState
          icon={<TableChart sx={{ fontSize: 56 }} />}
          title="No Results"
          description="No records found for this job"
          size="lg"
        />
      </Box>
    );
  }

  return (
    <TableContainer
      ref={parentRef}
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        backgroundColor: '#ffffff',
        '&::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#d1d5db',
          borderRadius: 4,
        },
      }}
    >
      <Table size="small" stickyHeader sx={{ minWidth: 1800 }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{ ...headerCellSx, minWidth: col.width, maxWidth: col.width }}
              >
                {col.label}
              </TableCell>
            ))}
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
            const isEvenRow = virtualRow.index % 2 === 0;

            return (
              <TableRow
                key={record.record_id}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  backgroundColor: isEvenRow ? '#ffffff' : '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                  },
                }}
              >
                <TableCell sx={{ ...bodyCellSx, minWidth: 160, maxWidth: 160 }}>
                  {[record.first_name, record.last_name].filter(Boolean).join(' ') || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 200, maxWidth: 200 }}>
                  {record.address || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 120, maxWidth: 120 }}>
                  {record.city || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 60, maxWidth: 60 }}>
                  {record.state || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 80, maxWidth: 80 }}>
                  {record.zip_code || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 130, maxWidth: 130 }}>
                  {record.phone_1 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 130, maxWidth: 130 }}>
                  {record.phone_2 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 130, maxWidth: 130 }}>
                  {record.phone_3 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 180, maxWidth: 180 }}>
                  {record.email_1 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 180, maxWidth: 180 }}>
                  {record.email_2 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 180, maxWidth: 180 }}>
                  {record.email_3 || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 90, maxWidth: 90 }}>
                  <StatusBadge
                    status={record.in_litigator_list === 'Yes' ? 'litigator' : 'clean'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100, fontSize: '0.75rem', color: textColors.tertiary }}>
                  {formatDate(record.processed_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default AirtableTable;
