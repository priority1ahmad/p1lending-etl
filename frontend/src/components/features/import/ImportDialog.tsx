/**
 * ImportDialog Component
 * Modal dialog for importing ETL job results to Lodasoft CRM
 */

import { useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Alert,
  Paper,
} from '@mui/material';
import { CheckCircle, Error, Upload } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { textColors } from '../../../theme';
import type { ImportLogEntry } from '../../../services/api/lodasoftImport';

export type ImportDialogStatus = 'idle' | 'loading' | 'in_progress' | 'completed' | 'failed';

export interface ImportDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Job name being imported */
  jobName: string;
  /** Total records to import */
  recordCount: number;
  /** Current status of the import */
  status: ImportDialogStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Records successfully imported */
  recordsImported?: number;
  /** Records that failed to import */
  recordsFailed?: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Log entries for real-time updates */
  logs?: ImportLogEntry[];
  /** Handler to close the dialog */
  onClose: () => void;
  /** Handler to start the import */
  onStartImport: () => void;
}

function getLogColor(level: string): string {
  switch (level) {
    case 'ERROR':
      return '#f48771';
    case 'WARNING':
      return '#cca700';
    default:
      return '#4ec9b0';
  }
}

export function ImportDialog({
  open,
  jobName,
  recordCount,
  status,
  progress = 0,
  recordsImported = 0,
  recordsFailed = 0,
  errorMessage,
  logs = [],
  onClose,
  onStartImport,
}: ImportDialogProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isInProgress = status === 'loading' || status === 'in_progress';
  const isComplete = status === 'completed' || status === 'failed';

  return (
    <Dialog
      open={open}
      onClose={isInProgress ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">Import to Lodasoft CRM</Typography>
      </DialogTitle>

      <DialogContent>
        {/* Job Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: textColors.secondary, mb: 0.5 }}>
            Job
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {jobName}
          </Typography>
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            {recordCount.toLocaleString()} records
          </Typography>
        </Box>

        {/* Progress Section */}
        {isInProgress && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: textColors.secondary }}>
                {status === 'loading' ? 'Starting import...' : 'Importing records...'}
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.primary, fontWeight: 600 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant={status === 'loading' ? 'indeterminate' : 'determinate'}
              value={progress}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="body2" sx={{ color: textColors.secondary, mt: 1 }}>
              {recordsImported.toLocaleString()} of {recordCount.toLocaleString()} records imported
            </Typography>
          </Box>
        )}

        {/* Completion Status */}
        {status === 'completed' && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              Import completed successfully! {recordsImported.toLocaleString()} records imported.
              {recordsFailed > 0 && ` ${recordsFailed} records failed.`}
            </Typography>
          </Alert>
        )}

        {status === 'failed' && (
          <Alert
            severity="error"
            icon={<Error />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              Import failed: {errorMessage || 'An unknown error occurred'}
            </Typography>
          </Alert>
        )}

        {/* Log Viewer */}
        {(logs.length > 0 || isInProgress) && (
          <Paper
            sx={{
              height: 200,
              overflow: 'auto',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              p: 2,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '12px',
              borderRadius: 2,
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#858585', textAlign: 'center', mt: 4 }}>
                Waiting for logs...
              </Typography>
            ) : (
              logs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    color: getLogColor(log.level),
                    mb: 0.5,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <span style={{ color: '#858585', minWidth: '180px', flexShrink: 0 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{ minWidth: '80px', flexShrink: 0 }}>[{log.level}]</span>
                  <span>{log.message}</span>
                </Box>
              ))
            )}
            <div ref={logsEndRef} />
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        {status === 'idle' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="accent"
              startIcon={<Upload />}
              onClick={onStartImport}
            >
              Start Import
            </Button>
          </>
        ) : isComplete ? (
          <Button variant="solid" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

export default ImportDialog;
