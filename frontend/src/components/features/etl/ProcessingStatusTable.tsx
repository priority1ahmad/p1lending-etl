/**
 * ProcessingStatusTable Component
 * Row-by-row processing display with expandable details
 */

import { useRef, useEffect, Fragment } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { StatusBadge } from '../../ui/Badge/StatusBadge';
import type { ComplianceStatus } from '../../ui/Badge/StatusBadge';
import { textColors, backgrounds, palette } from '../../../theme';

export interface ProcessedRow {
  row_number: number;
  first_name: string;
  last_name: string;
  address: string;
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
  phone_1_in_dnc?: string;
  phone_2_in_dnc?: string;
  phone_3_in_dnc?: string;
  status: string;
  batch?: number;
}

export interface ProcessingStatusTableProps {
  /** Processed rows data */
  rows: ProcessedRow[];
  /** Set of expanded row numbers */
  expandedRows: Set<number>;
  /** Toggle row expansion handler */
  onToggleRow: (rowNumber: number) => void;
}

function getComplianceStatus(row: ProcessedRow): { status: ComplianceStatus; label: string } {
  const isLitigator = row.in_litigator_list === 'Yes';
  const inDNC = [row.phone_1_in_dnc, row.phone_2_in_dnc, row.phone_3_in_dnc].some(
    (status) => status === 'Yes'
  );

  if (isLitigator && inDNC) return { status: 'both', label: 'Both Lists' };
  if (isLitigator) return { status: 'litigator', label: 'Litigator' };
  if (inDNC) return { status: 'dnc', label: 'DNC Only' };
  return { status: 'clean', label: 'Clean' };
}

function getPhoneCount(row: ProcessedRow): number {
  return [row.phone_1, row.phone_2, row.phone_3].filter((p) => p && p.trim()).length;
}

export function ProcessingStatusTable({
  rows,
  expandedRows,
  onToggleRow,
}: ProcessingStatusTableProps) {
  const rowsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new rows arrive
  useEffect(() => {
    rowsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows]);

  return (
    <Card variant="default" padding="lg" sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: textColors.primary,
          mb: 2,
        }}
      >
        Processing Status - Last {rows.length} Rows
      </Typography>

      <Paper
        sx={{
          height: 400,
          overflow: 'auto',
          backgroundColor: backgrounds.secondary,
          p: 2,
          borderRadius: 2,
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Row #</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Phones</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Compliance</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 600, color: textColors.primary }} align="center">
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const isExpanded = expandedRows.has(row.row_number);
                const complianceStatus = getComplianceStatus(row);
                const phoneCount = getPhoneCount(row);

                return (
                  <Fragment key={index}>
                    {/* Summary Row */}
                    <TableRow
                      hover
                      sx={{
                        backgroundColor: index % 2 === 0 ? backgrounds.primary : backgrounds.secondary,
                        '&:hover': { backgroundColor: '#e3f2fd' },
                      }}
                    >
                      <TableCell sx={{ color: textColors.secondary }}>{row.row_number}</TableCell>
                      <TableCell sx={{ color: textColors.primary }}>
                        {`${row.first_name} ${row.last_name}`}
                      </TableCell>
                      <TableCell sx={{ color: textColors.secondary }}>
                        {`${row.city || ''}, ${row.state || ''}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${phoneCount} phone${phoneCount !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            backgroundColor: phoneCount > 0 ? palette.success[50] : undefined,
                            color: phoneCount > 0 ? palette.success[700] : textColors.secondary,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={complianceStatus.status} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: textColors.secondary }}>{row.batch || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => onToggleRow(row.row_number)}>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{ backgroundColor: backgrounds.tertiary, p: 2 }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, mb: 1, color: textColors.primary }}
                            >
                              Contact Details
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {/* Phones */}
                              <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Phones:</strong>
                                </Typography>
                                {[
                                  { num: row.phone_1, dnc: row.phone_1_in_dnc },
                                  { num: row.phone_2, dnc: row.phone_2_in_dnc },
                                  { num: row.phone_3, dnc: row.phone_3_in_dnc },
                                ].map(
                                  (phone, i) =>
                                    phone.num &&
                                    phone.num.trim() && (
                                      <Box key={i} sx={{ ml: 2, mb: 0.5 }}>
                                        {phone.num}
                                        {phone.dnc === 'Yes' && (
                                          <Chip
                                            label="DNC"
                                            size="small"
                                            sx={{
                                              ml: 1,
                                              height: 20,
                                              backgroundColor: palette.warning[50],
                                              color: palette.warning[700],
                                            }}
                                          />
                                        )}
                                      </Box>
                                    )
                                )}
                                {phoneCount === 0 && (
                                  <Typography
                                    variant="body2"
                                    sx={{ ml: 2, color: textColors.secondary }}
                                  >
                                    No phones found
                                  </Typography>
                                )}
                              </Box>

                              {/* Emails */}
                              <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Emails:</strong>
                                </Typography>
                                {[row.email_1, row.email_2, row.email_3]
                                  .filter((e) => e && e.trim())
                                  .map((email, i) => (
                                    <Box key={i} sx={{ ml: 2, mb: 0.5 }}>
                                      {email}
                                    </Box>
                                  ))}
                                {[row.email_1, row.email_2, row.email_3].filter((e) => e && e.trim())
                                  .length === 0 && (
                                  <Typography
                                    variant="body2"
                                    sx={{ ml: 2, color: textColors.secondary }}
                                  >
                                    No emails found
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            <Typography variant="body2" sx={{ mt: 2 }}>
                              <strong>Full Address:</strong> {row.address}, {row.city}, {row.state}{' '}
                              {row.zip_code}
                            </Typography>

                            {row.in_litigator_list === 'Yes' && (
                              <Box sx={{ mt: 2 }}>
                                <Chip
                                  label="Person is on Litigator List"
                                  size="small"
                                  sx={{
                                    backgroundColor: palette.warning[50],
                                    color: palette.warning[700],
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <div ref={rowsEndRef} />
      </Paper>
    </Card>
  );
}

export default ProcessingStatusTable;
