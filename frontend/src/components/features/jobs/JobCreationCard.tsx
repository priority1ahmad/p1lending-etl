/**
 * JobCreationCard Component
 * Form for creating new ETL jobs
 * Clean, professional job configuration interface
 */

import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { PlayArrow, Preview } from '@mui/icons-material';
import { Card } from '../../ui/Card/Card';
import { palette } from '../../../theme';

export interface Script {
  id: string;
  name: string;
}

export interface JobCreationCardProps {
  /** Available SQL scripts */
  scripts: Script[];
  /** Preview button handler */
  onPreview: (scriptId: string, rowLimit?: number) => void;
  /** Start job handler */
  onStartJob: (scriptId: string, rowLimit?: number) => void;
  /** Loading states */
  isPreviewLoading?: boolean;
  isStarting?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Job creation form card
 *
 * @example
 * <JobCreationCard
 *   scripts={[{ id: '1', name: 'Daily Leads' }]}
 *   onPreview={(id, limit) => console.log('Preview', id, limit)}
 *   onStartJob={(id, limit) => console.log('Start', id, limit)}
 * />
 */
export function JobCreationCard({
  scripts,
  onPreview,
  onStartJob,
  isPreviewLoading = false,
  isStarting = false,
  disabled = false,
}: JobCreationCardProps) {
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [rowLimit, setRowLimit] = useState('');

  const handlePreview = () => {
    if (!selectedScriptId) return;
    const limit = rowLimit ? parseInt(rowLimit) : undefined;
    onPreview(selectedScriptId, limit);
  };

  const handleStart = () => {
    if (!selectedScriptId) return;
    const limit = rowLimit ? parseInt(rowLimit) : undefined;
    onStartJob(selectedScriptId, limit);
  };

  const isButtonDisabled = !selectedScriptId || disabled || isStarting;

  return (
    <Card variant="default" padding="md">
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 600,
          fontSize: '1.125rem',
        }}
      >
        Create New ETL Job
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl fullWidth>
          <InputLabel>SQL Script *</InputLabel>
          <Select
            value={selectedScriptId}
            onChange={(e) => setSelectedScriptId(e.target.value)}
            label="SQL Script *"
            disabled={disabled}
          >
            <MenuItem value="">
              <em>Select a script...</em>
            </MenuItem>
            {scripts.map((script) => (
              <MenuItem key={script.id} value={script.id}>
                {script.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Row Limit (Optional)"
          type="number"
          value={rowLimit}
          onChange={(e) => setRowLimit(e.target.value)}
          helperText="Leave empty to process all records"
          disabled={disabled}
          inputProps={{ min: 1 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={handlePreview}
            disabled={isButtonDisabled || isPreviewLoading}
            fullWidth
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            {isPreviewLoading ? 'Loading...' : 'Get Preview'}
          </Button>

          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={isButtonDisabled}
            fullWidth
            sx={{
              backgroundColor: palette.accent[500],
              '&:hover': {
                backgroundColor: palette.accent[600],
              },
            }}
          >
            {isStarting ? 'Starting...' : 'Start ETL Job'}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

export default JobCreationCard;
