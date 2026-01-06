/**
 * ImportButton Component
 * Dropdown button for importing to Lodasoft CRM or exporting CSV
 */

import { useState } from 'react';
import {
  Box,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@mui/material';
import { ArrowDropDown, Upload, Download } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';

export interface ImportButtonProps {
  /** Callback when Import to Lodasoft is clicked */
  onImport: () => void;
  /** Callback when Export CSV is clicked */
  onExport: () => void;
  /** Whether an import is currently in progress */
  isImporting?: boolean;
  /** Whether an export is currently in progress */
  isExporting?: boolean;
  /** Disable the button (e.g., no job selected) */
  disabled?: boolean;
}

export function ImportButton({
  onImport,
  onExport,
  isImporting = false,
  isExporting = false,
  disabled = false,
}: ImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = (event: Event) => {
    if (anchorEl?.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const handleImportClick = () => {
    setOpen(false);
    onImport();
  };

  const handleExportClick = () => {
    setOpen(false);
    onExport();
  };

  const isLoading = isImporting || isExporting;
  const loadingText = isImporting ? 'Importing...' : isExporting ? 'Exporting...' : '';

  return (
    <Box sx={{ display: 'inline-flex' }}>
      <ButtonGroup ref={setAnchorEl}>
        <Button
          variant="solid"
          colorScheme="accent"
          startIcon={<Upload />}
          onClick={handleImportClick}
          loading={isLoading}
          loadingText={loadingText}
          disabled={disabled}
        >
          Import to Lodasoft
        </Button>
        <Button
          variant="solid"
          colorScheme="accent"
          size="small"
          onClick={handleToggle}
          disabled={disabled || isLoading}
          sx={{ minWidth: 32 }}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorEl}
        transition
        disablePortal
        placement="bottom-end"
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={8}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList>
                  <MenuItem onClick={handleImportClick}>
                    <Upload sx={{ mr: 1 }} fontSize="small" />
                    Import to Lodasoft
                  </MenuItem>
                  <MenuItem onClick={handleExportClick}>
                    <Download sx={{ mr: 1 }} fontSize="small" />
                    Export CSV
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}

export default ImportButton;
