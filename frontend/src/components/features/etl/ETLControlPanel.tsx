/**
 * ETLControlPanel Component
 * Script selector, row limit input, and action buttons for ETL jobs
 */

import type { ChangeEvent } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { PlayArrow, Preview } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { textColors } from '../../../theme';

export interface Script {
  id: string;
  name: string;
  description?: string;
}

export interface ETLControlPanelProps {
  /** Available SQL scripts */
  scripts: Script[];
  /** Currently selected script ID */
  selectedScriptId: string;
  /** Row limit value */
  rowLimit: string;
  /** Is preview loading */
  isPreviewLoading: boolean;
  /** Is job creation loading */
  isJobLoading: boolean;
  /** Is a job currently running */
  isJobRunning: boolean;
  /** Script selection handler */
  onScriptChange: (scriptId: string) => void;
  /** Row limit change handler */
  onRowLimitChange: (value: string) => void;
  /** Preview button click handler */
  onPreview: () => void;
  /** Start ETL button click handler */
  onStartETL: () => void;
}

export function ETLControlPanel({
  scripts,
  selectedScriptId,
  rowLimit,
  isPreviewLoading,
  isJobLoading,
  isJobRunning,
  onScriptChange,
  onRowLimitChange,
  onPreview,
  onStartETL,
}: ETLControlPanelProps) {
  const handleScriptChange = (event: { target: { value: string } }) => {
    onScriptChange(event.target.value);
  };

  const handleRowLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRowLimitChange(event.target.value);
  };

  return (
    <Card
      title="ETL Control Panel"
      variant="default"
      padding="lg"
      sx={{ maxWidth: 600, mx: 'auto' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FormControl fullWidth>
          <InputLabel id="script-select-label">SQL Script</InputLabel>
          <Select
            labelId="script-select-label"
            value={selectedScriptId}
            onChange={handleScriptChange}
            label="SQL Script"
          >
            <MenuItem value="">Select a script...</MenuItem>
            {scripts.map((script) => (
              <MenuItem key={script.id} value={script.id}>
                {script.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Row Limit (Optional)"
          type="number"
          value={rowLimit}
          onChange={handleRowLimitChange}
          helperText="Leave empty to process all records"
          slotProps={{
            input: {
              inputProps: { min: 1 },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
          <Button
            variant="outline"
            startIcon={<Preview />}
            onClick={onPreview}
            disabled={!selectedScriptId || isPreviewLoading}
            loading={isPreviewLoading}
            loadingText="Loading..."
            sx={{
              borderColor: textColors.primary,
              color: textColors.primary,
            }}
          >
            Get Preview
          </Button>

          <Button
            variant="solid"
            colorScheme="accent"
            startIcon={<PlayArrow />}
            onClick={onStartETL}
            disabled={!selectedScriptId || isJobLoading || isJobRunning}
            loading={isJobLoading}
            loadingText="Starting..."
          >
            Start ETL
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

export default ETLControlPanel;
