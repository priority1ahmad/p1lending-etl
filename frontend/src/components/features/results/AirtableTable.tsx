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
  // Metadata
  record_id: string;
  job_name?: string;
  table_id?: string;
  table_title?: string;
  processed_at: string;

  // Lead Information
  lead_number?: string;
  campaign_date?: string;
  lead_campaign?: string;
  lead_source?: string;
  ref_id?: string;

  // Person Data
  first_name?: string;
  last_name?: string;
  co_borrower_full_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Property Data
  total_units?: string;
  owner_occupied?: string;
  annual_tax_amount?: string;
  assessed_value?: string;
  estimated_value?: string;

  // First Mortgage
  ltv?: string;
  loan_type?: string;
  first_mortgage_type?: string;
  first_mortgage_amount?: string;
  first_mortgage_balance?: string;
  term?: string;
  estimated_new_payment?: string;

  // Second Mortgage
  second_mortgage_type?: string;
  second_mortgage_term?: string;
  second_mortgage_balance?: string;
  has_second_mortgage?: string;

  // Current Loan Details
  current_interest_rate?: string;
  current_lender?: string;
  arm_index_type?: string;
  origination_date?: string;
  rate_adjustment_date?: string;

  // Phone Data
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;

  // Email Data
  email_1?: string;
  email_2?: string;
  email_3?: string;

  // Compliance Flags
  in_litigator_list?: string;
  phone_1_in_dnc?: string;
  phone_2_in_dnc?: string;
  phone_3_in_dnc?: string;
}

export interface AirtableTableProps {
  records: TableRecord[];
  isLoading: boolean;
}

// Table columns configuration - all 42 columns from MASTER_PROCESSED_DB
const columns = [
  // Lead Information
  { key: 'lead_number', label: 'Lead #', width: 100 },
  { key: 'campaign_date', label: 'Campaign Date', width: 120 },
  { key: 'lead_campaign', label: 'Campaign', width: 140 },
  { key: 'lead_source', label: 'Source', width: 120 },
  { key: 'ref_id', label: 'Ref ID', width: 100 },

  // Person Data
  { key: 'name', label: 'Name', width: 160 },
  { key: 'co_borrower', label: 'Co-Borrower', width: 160 },
  { key: 'address', label: 'Address', width: 200 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'state', label: 'State', width: 60 },
  { key: 'zip', label: 'Zip', width: 80 },

  // Property Data
  { key: 'total_units', label: 'Units', width: 70 },
  { key: 'owner_occupied', label: 'Owner Occ', width: 90 },
  { key: 'annual_tax_amount', label: 'Annual Tax', width: 100 },
  { key: 'assessed_value', label: 'Assessed Val', width: 110 },
  { key: 'estimated_value', label: 'Est Value', width: 110 },

  // First Mortgage
  { key: 'ltv', label: 'LTV', width: 70 },
  { key: 'loan_type', label: 'Loan Type', width: 100 },
  { key: 'first_mortgage_type', label: '1st Mtg Type', width: 110 },
  { key: 'first_mortgage_amount', label: '1st Mtg Amt', width: 110 },
  { key: 'first_mortgage_balance', label: '1st Mtg Bal', width: 110 },
  { key: 'term', label: 'Term', width: 70 },
  { key: 'estimated_new_payment', label: 'Est Payment', width: 110 },

  // Second Mortgage
  { key: 'second_mortgage_type', label: '2nd Mtg Type', width: 110 },
  { key: 'second_mortgage_term', label: '2nd Mtg Term', width: 110 },
  { key: 'second_mortgage_balance', label: '2nd Mtg Bal', width: 110 },
  { key: 'has_second_mortgage', label: 'Has 2nd', width: 80 },

  // Current Loan Details
  { key: 'current_interest_rate', label: 'Rate', width: 70 },
  { key: 'current_lender', label: 'Lender', width: 150 },
  { key: 'arm_index_type', label: 'ARM Index', width: 100 },
  { key: 'origination_date', label: 'Orig Date', width: 100 },
  { key: 'rate_adjustment_date', label: 'Rate Adj', width: 100 },

  // Contact Info
  { key: 'phone_1', label: 'Phone 1', width: 130 },
  { key: 'phone_2', label: 'Phone 2', width: 130 },
  { key: 'phone_3', label: 'Phone 3', width: 130 },
  { key: 'email_1', label: 'Email 1', width: 180 },
  { key: 'email_2', label: 'Email 2', width: 180 },
  { key: 'email_3', label: 'Email 3', width: 180 },

  // Compliance & Status
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
      <Table size="small" stickyHeader sx={{ minWidth: 4500 }}>
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
                {/* Lead Information */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.lead_number || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 120, maxWidth: 120 }}>
                  {record.campaign_date || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 140, maxWidth: 140 }}>
                  {record.lead_campaign || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 120, maxWidth: 120 }}>
                  {record.lead_source || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.ref_id || '-'}
                </TableCell>

                {/* Person Data */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 160, maxWidth: 160 }}>
                  {[record.first_name, record.last_name].filter(Boolean).join(' ') || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 160, maxWidth: 160 }}>
                  {record.co_borrower_full_name || '-'}
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

                {/* Property Data */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 70, maxWidth: 70 }}>
                  {record.total_units || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 90, maxWidth: 90 }}>
                  {record.owner_occupied || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.annual_tax_amount || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.assessed_value || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.estimated_value || '-'}
                </TableCell>

                {/* First Mortgage */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 70, maxWidth: 70 }}>
                  {record.ltv || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.loan_type || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.first_mortgage_type || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.first_mortgage_amount || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.first_mortgage_balance || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 70, maxWidth: 70 }}>
                  {record.term || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.estimated_new_payment || '-'}
                </TableCell>

                {/* Second Mortgage */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.second_mortgage_type || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.second_mortgage_term || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 110, maxWidth: 110 }}>
                  {record.second_mortgage_balance || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 80, maxWidth: 80 }}>
                  {record.has_second_mortgage || '-'}
                </TableCell>

                {/* Current Loan Details */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 70, maxWidth: 70 }}>
                  {record.current_interest_rate || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 150, maxWidth: 150 }}>
                  {record.current_lender || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.arm_index_type || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.origination_date || '-'}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100 }}>
                  {record.rate_adjustment_date || '-'}
                </TableCell>

                {/* Contact Info */}
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

                {/* Compliance & Status */}
                <TableCell sx={{ ...bodyCellSx, minWidth: 90, maxWidth: 90, textAlign: 'center' }}>
                  <StatusBadge
                    status={record.in_litigator_list === 'Yes' ? 'litigator' : 'clean'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 100, maxWidth: 100, fontSize: '0.75rem', color: textColors.tertiary, textAlign: 'center' }}>
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
