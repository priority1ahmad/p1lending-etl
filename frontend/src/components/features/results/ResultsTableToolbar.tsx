/**
 * ResultsTableToolbar Component
 * Provides table controls: search, column visibility, filters, and export
 */

import { useState } from 'react';
import type { MouseEvent } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Search, ViewColumn, Download } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { textColors } from '../../../theme';

export interface ColumnVisibility {
  name: boolean;
  address: boolean;
  city: boolean;
  state: boolean;
  zip: boolean;
  phone: boolean;
  email: boolean;
  litigator: boolean;
  processed: boolean;
}

export interface ResultsTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  excludeLitigators: boolean;
  onToggleExclude: (exclude: boolean) => void;
  onExport: () => void;
  isExporting: boolean;
  columnVisibility?: ColumnVisibility;
  onColumnVisibilityChange?: (visibility: ColumnVisibility) => void;
}

export function ResultsTableToolbar({
  searchQuery,
  onSearchChange,
  excludeLitigators,
  onToggleExclude,
  onExport,
  isExporting,
  columnVisibility,
  onColumnVisibilityChange,
}: ResultsTableToolbarProps) {
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  const handleColumnMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const handleColumnToggle = (column: keyof ColumnVisibility) => {
    if (columnVisibility && onColumnVisibilityChange) {
      onColumnVisibilityChange({
        ...columnVisibility,
        [column]: !columnVisibility[column],
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 2,
      }}
    >
      {/* Left side: Search */}
      <TextField
        size="small"
        placeholder="Search records..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: textColors.secondary, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Right side: Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {/* Column visibility menu */}
        {columnVisibility && onColumnVisibilityChange && (
          <>
            <IconButton
              onClick={handleColumnMenuOpen}
              size="small"
              sx={{
                color: textColors.secondary,
                '&:hover': {
                  color: textColors.primary,
                },
              }}
            >
              <ViewColumn />
            </IconButton>
            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={handleColumnMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem dense onClick={() => handleColumnToggle('name')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.name}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Name</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('address')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.address}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Address</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('city')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.city}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">City</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('state')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.state}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">State</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('zip')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.zip}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Zip</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('phone')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.phone}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Phone</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('email')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.email}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Email</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('litigator')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.litigator}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Litigator</Typography>
              </MenuItem>
              <MenuItem dense onClick={() => handleColumnToggle('processed')}>
                <Checkbox
                  size="small"
                  checked={columnVisibility.processed}
                  sx={{ mr: 1, py: 0 }}
                />
                <Typography variant="body2">Processed At</Typography>
              </MenuItem>
            </Menu>
          </>
        )}

        {/* Exclude litigators toggle */}
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

        {/* Export button */}
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
  );
}

export default ResultsTableToolbar;
