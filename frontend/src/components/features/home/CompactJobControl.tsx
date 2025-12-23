/**
 * CompactJobControl Component
 * Minimal ETL control panel - script selector + action buttons in one row
 * Inspired by Airtable's compact form patterns
 */

import type { ChangeEvent } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { PlayArrow, Preview, Info } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { palette, textColors, borderColors, backgrounds } from '../../../theme';

export interface Script {
  id: string;
  name: string;
  description?: string;
}

export interface CompactJobControlProps {
  /** Available SQL scripts */
  scripts: Script[];
  /** Currently selected script ID */
  selectedScriptId: string;
  /** Row limit value */
  rowLimit: string;
  /** Is preview loading */
  isPreviewLoading?: boolean;
  /** Is job creation loading */
  isJobLoading?: boolean;
  /** Is a job currently running */
  isJobRunning?: boolean;
  /** Script selection handler */
  onScriptChange: (scriptId: string) => void;
  /** Row limit change handler */
  onRowLimitChange: (value: string) => void;
  /** Preview button click handler */
  onPreview: () => void;
  /** Start ETL button click handler */
  onStartETL: () => void;
}

/**
 * Compact ETL control panel in a single row
 *
 * @example
 * <CompactJobControl
 *   scripts={scripts}
 *   selectedScriptId={selectedScript}
 *   rowLimit={rowLimit}
 *   onScriptChange={setSelectedScript}
 *   onRowLimitChange={setRowLimit}
 *   onPreview={handlePreview}
 *   onStartETL={handleStart}
 * />
 */
export function CompactJobControl({
  scripts,
  selectedScriptId,
  rowLimit,
  isPreviewLoading = false,
  isJobLoading = false,
  isJobRunning = false,
  onScriptChange,
  onRowLimitChange,
  onPreview,
  onStartETL,
}: CompactJobControlProps) {
  const handleScriptChange = (event: { target: { value: string } }) => {
    onScriptChange(event.target.value);
  };

  const handleRowLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRowLimitChange(event.target.value);
  };

  const selectedScript = scripts.find((s) => s.id === selectedScriptId);

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${borderColors.default}`,
        backgroundColor: backgrounds.primary,
      }}
    >
      {/* Title row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isJobRunning
                ? palette.success[500]
                : palette.gray[300],
              animation: isJobRunning ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Box
            component="span"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: textColors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ETL Control
          </Box>
        </Box>
        {isJobRunning && (
          <Box
            sx={{
              fontSize: '0.75rem',
              color: palette.success[600],
              fontWeight: 500,
            }}
          >
            Job Running
          </Box>
        )}
      </Box>

      {/* Controls row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        {/* Script selector */}
        <FormControl
          size="small"
          sx={{
            flex: { xs: '1 1 100%', md: '1 1 auto' },
            minWidth: 200,
          }}
        >
          <InputLabel id="compact-script-select">Script</InputLabel>
          <Select
            labelId="compact-script-select"
            value={selectedScriptId}
            onChange={handleScriptChange}
            label="Script"
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            <MenuItem value="">
              <em>Select script...</em>
            </MenuItem>
            {scripts.map((script) => (
              <MenuItem key={script.id} value={script.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <span>{script.name}</span>
                  {script.description && (
                    <Tooltip title={script.description} arrow>
                      <Info
                        sx={{
                          fontSize: 14,
                          color: textColors.secondary,
                          ml: 1,
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Row limit */}
        <TextField
          size="small"
          label="Limit"
          type="number"
          value={rowLimit}
          onChange={handleRowLimitChange}
          placeholder="All"
          slotProps={{
            input: {
              inputProps: { min: 1 },
              endAdornment: rowLimit ? (
                <InputAdornment position="end">
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.6875rem',
                      color: textColors.secondary,
                    }}
                  >
                    rows
                  </Box>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            width: { xs: '100%', sm: 120 },
            flex: { xs: '1 1 100%', sm: '0 0 auto' },
          }}
        />

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flex: { xs: '1 1 100%', md: '0 0 auto' },
          }}
        >
          <Button
            variant="outline"
            size="small"
            startIcon={<Preview />}
            onClick={onPreview}
            disabled={!selectedScriptId || isPreviewLoading}
            loading={isPreviewLoading}
            sx={{
              minWidth: 100,
              borderColor: borderColors.strong,
              color: textColors.primary,
            }}
          >
            Preview
          </Button>

          <Button
            variant="solid"
            colorScheme="accent"
            size="small"
            startIcon={<PlayArrow />}
            onClick={onStartETL}
            disabled={!selectedScriptId || isJobLoading || isJobRunning}
            loading={isJobLoading}
            sx={{ minWidth: 100 }}
          >
            Run ETL
          </Button>
        </Box>
      </Box>

      {/* Selected script info */}
      {selectedScript?.description && (
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${borderColors.light}`,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '0.75rem',
              color: textColors.secondary,
            }}
          >
            {selectedScript.description}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CompactJobControl;
