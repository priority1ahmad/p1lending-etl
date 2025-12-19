/**
 * PreviewDialog Component
 * Modal for displaying ETL job preview data with optional execution confirmation
 */

import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { textColors, backgrounds, palette } from '../../../theme';

export interface PreviewItem {
  script_name: string;
  total_rows?: number;
  row_count?: number;
  already_processed?: number;
  unprocessed?: number;
  rows?: Record<string, unknown>[];
}

export interface PreviewDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Is this preview for execution confirmation */
  isForExecution: boolean;
  /** Is preview data loading */
  isLoading: boolean;
  /** Loading message */
  loadingMessage: string;
  /** Error message if any */
  error?: string;
  /** Preview data */
  data: PreviewItem[];
  /** Row limit for execution */
  rowLimit?: string;
  /** Close dialog handler */
  onClose: () => void;
  /** Confirm and execute handler (for execution mode) */
  onConfirmExecute?: () => void;
}

const MAX_DISPLAY_ROWS = 100;

function LoadingIndicator({ message }: { message: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
      <CircularProgress size={60} />
      <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: textColors.secondary }}>
        Please wait while we fetch your data...
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `pulse 1.5s ease-in-out infinite ${i * 0.2}s`,
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function ExecutionWarning() {
  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        bgcolor: palette.warning[50],
        borderRadius: 1,
        border: `1px solid ${palette.warning[500]}`,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: palette.warning[700] }}>
        Performance Notice
      </Typography>
      <Typography variant="body2" sx={{ color: textColors.secondary }}>
        Large queries with many records may take 5-10 minutes to complete. The ETL process will:
      </Typography>
      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
        <Typography component="li" variant="body2" sx={{ color: textColors.secondary }}>
          Check each record against the processed cache
        </Typography>
        <Typography component="li" variant="body2" sx={{ color: textColors.secondary }}>
          Look up phone numbers and emails via idiCORE API
        </Typography>
        <Typography component="li" variant="body2" sx={{ color: textColors.secondary }}>
          Check against litigator and DNC lists
        </Typography>
        <Typography component="li" variant="body2" sx={{ color: textColors.secondary }}>
          Upload results to Snowflake
        </Typography>
      </Box>
    </Box>
  );
}

function ProcessingStatusSection({ item }: { item: PreviewItem }) {
  if (item.total_rows === undefined) return null;

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        p: 2,
        bgcolor: backgrounds.secondary,
        borderRadius: 1,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: textColors.primary,
          mb: 1.5,
        }}
      >
        Processing Status
      </Typography>
      <Grid container spacing={2}>
        {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            Already Processed
          </Typography>
          <Typography variant="h6" sx={{ color: palette.accent[500] }}>
            {(item.already_processed ?? 0).toLocaleString()}
          </Typography>
        </Grid>
        {/* @ts-expect-error - MUI v7 Grid item prop works at runtime */}
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ color: textColors.secondary }}>
            New to Process
          </Typography>
          <Typography variant="h6" sx={{ color: palette.success[500] }}>
            {(item.unprocessed ?? 0).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
  const hasMoreRows = rows.length > MAX_DISPLAY_ROWS;

  return (
    <>
      {hasMoreRows && (
        <Typography
          variant="body2"
          sx={{ mt: 2, mb: 1, fontStyle: 'italic', color: textColors.secondary }}
        >
          Showing first {MAX_DISPLAY_ROWS.toLocaleString()} of {rows.length.toLocaleString()} rows
          (to save memory)
        </Typography>
      )}
      <TableContainer sx={{ mt: hasMoreRows ? 0 : 2, maxHeight: 500, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(displayRows[0]).map((key) => (
                <TableCell key={key} sx={{ fontWeight: 600, color: textColors.primary }}>
                  {key}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {Object.values(row).map((value, cellIndex) => (
                  <TableCell key={cellIndex} sx={{ color: textColors.secondary }}>
                    {value !== null && value !== undefined ? String(value) : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export function PreviewDialog({
  open,
  isForExecution,
  isLoading,
  loadingMessage,
  error,
  data,
  rowLimit,
  onClose,
  onConfirmExecute,
}: PreviewDialogProps) {
  const calculateRowsToProcess = () => {
    if (data.length === 0) return 0;
    const unprocessedCount = data[0]?.unprocessed ?? 0;
    const rowLimitNum = rowLimit ? parseInt(rowLimit) : null;
    return rowLimitNum ? Math.min(rowLimitNum, unprocessedCount) : unprocessedCount;
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">
          {isForExecution ? 'ETL Job Preview & Confirmation' : 'ETL Job Preview'}
        </Typography>
        {isForExecution && (
          <Typography variant="body2" sx={{ mt: 1, color: palette.warning[500] }}>
            Large queries may take 5-10 minutes to process. Please review the preview before
            confirming.
          </Typography>
        )}
        {isLoading && <CircularProgress size={20} sx={{ ml: 2, verticalAlign: 'middle' }} />}
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <LoadingIndicator message={loadingMessage} />
        ) : error ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: palette.error[500] }}>
              Error loading preview: {error}
            </Typography>
          </Box>
        ) : data.length === 0 ? (
          <Typography variant="body2" sx={{ py: 2, color: textColors.secondary }}>
            No preview data available
          </Typography>
        ) : (
          <>
            {isForExecution && data.length > 0 && <ExecutionWarning />}

            {data.map((item, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {item.script_name}
                </Typography>
                <Typography variant="body2" sx={{ color: textColors.secondary }} gutterBottom>
                  Total Rows: {(item.total_rows ?? item.row_count ?? 0).toLocaleString()}
                </Typography>

                <ProcessingStatusSection item={item} />

                {item.rows && item.rows.length > 0 ? (
                  <DataTable rows={item.rows} />
                ) : (
                  <Typography variant="body2" sx={{ mt: 2, color: textColors.secondary }}>
                    No row data available. Set a row limit to preview actual data.
                  </Typography>
                )}
              </Box>
            ))}
          </>
        )}
      </DialogContent>

      <DialogActions>
        {isForExecution ? (
          <>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="primary"
              startIcon={<PlayArrow />}
              onClick={onConfirmExecute}
              disabled={isLoading || data.length === 0}
            >
              {isLoading
                ? 'Loading Preview...'
                : `Execute ETL Job (${calculateRowsToProcess().toLocaleString()} rows)`}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default PreviewDialog;
