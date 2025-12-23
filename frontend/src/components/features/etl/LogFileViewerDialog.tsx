/**
 * LogFileViewerDialog Component
 * Full log file viewer with download functionality
 */

import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { textColors } from '../../../theme';

export interface LogFileViewerDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Log file content */
  content: string;
  /** Is content loading */
  isLoading: boolean;
  /** Job ID for download filename */
  jobId?: string;
  /** Close dialog handler */
  onClose: () => void;
}

function getLineColor(line: string): string {
  if (line.includes('ERROR') || line.includes('❌')) return '#f48771';
  if (line.includes('WARNING') || line.includes('⚠️')) return '#cca700';
  return '#4ec9b0';
}

export function LogFileViewerDialog({
  open,
  content,
  isLoading,
  jobId,
  onClose,
}: LogFileViewerDialogProps) {
  const handleDownload = () => {
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId || 'log'}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Log File</Typography>
          {content && (
            <Button variant="ghost" startIcon={<Download />} onClick={handleDownload}>
              Download
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : content ? (
          <Paper
            sx={{
              height: 600,
              overflow: 'auto',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              p: 2,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              borderRadius: 2,
            }}
          >
            {content.split('\n').map((line, index) => (
              <Box
                key={index}
                sx={{
                  color: getLineColor(line),
                  display: 'flex',
                  gap: 1,
                }}
              >
                <span style={{ color: '#858585', minWidth: 40 }}>{index + 1}</span>
                <span>{line}</span>
              </Box>
            ))}
          </Paper>
        ) : (
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            No log file available for this job.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LogFileViewerDialog;
