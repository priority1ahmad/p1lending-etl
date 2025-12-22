/**
 * TableFooter Component
 * Footer bar with exclude litigators toggle, record count, and pagination
 */

import type { ChangeEvent } from 'react';
import { Box, Typography, FormControlLabel, Switch, Pagination } from '@mui/material';
import { textColors } from '../../../theme';

export interface TableFooterProps {
  total: number;
  currentPage: number;
  recordsPerPage: number;
  excludeLitigators: boolean;
  onPageChange: (page: number) => void;
  onToggleExclude: (exclude: boolean) => void;
}

export function TableFooter({
  total,
  currentPage,
  recordsPerPage,
  excludeLitigators,
  onPageChange,
  onToggleExclude,
}: TableFooterProps) {
  const totalPages = Math.ceil(total / recordsPerPage);
  const startRecord = total === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, total);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      {/* Left: Exclude Litigators Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={excludeLitigators}
            onChange={(e) => onToggleExclude(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="body2" sx={{ color: textColors.secondary, fontSize: '0.8125rem' }}>
            Exclude Litigators
          </Typography>
        }
      />

      {/* Center: Record Count */}
      <Typography
        variant="body2"
        sx={{
          color: textColors.secondary,
          fontSize: '0.8125rem',
        }}
      >
        Showing {startRecord.toLocaleString()}-{endRecord.toLocaleString()} of {total.toLocaleString()}
      </Typography>

      {/* Right: Pagination */}
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        size="small"
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: '0.8125rem',
          },
        }}
      />
    </Box>
  );
}

export default TableFooter;
