/**
 * PreviewDialogCompact Component
 * Streamlined preview dialog matching the new dashboard design
 * Shows script stats, processing counts, and sample data
 */

import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { Close, PlayArrow, Warning, CheckCircle } from '@mui/icons-material';
import { Button } from '../../ui/Button/Button';
import { palette, textColors, backgrounds, borderColors } from '../../../theme';

export interface PreviewStats {
  scriptName: string;
  totalRows: number;
  alreadyProcessed: number;
  unprocessed: number;
  sampleRows?: Record<string, unknown>[];
}

export interface PreviewDialogCompactProps {
  /** Dialog open state */
  open: boolean;
  /** Is this preview for execution confirmation */
  isForExecution?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  error?: string;
  /** Preview data */
  data?: PreviewStats;
  /** Row limit (for display) */
  rowLimit?: number;
  /** Close handler */
  onClose: () => void;
  /** Execute handler (for execution mode) */
  onExecute?: () => void;
}

const MAX_SAMPLE_ROWS = 10;

function StatCard({
  label,
  value,
  color = 'default',
}: {
  label: string;
  value: number;
  color?: 'default' | 'success' | 'warning' | 'info';
}) {
  const colorMap = {
    default: textColors.primary,
    success: palette.success[600],
    warning: palette.warning[600],
    info: palette.accent[600],
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        backgroundColor: backgrounds.secondary,
        border: `1px solid ${borderColors.light}`,
        textAlign: 'center',
        flex: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: textColors.secondary,
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colorMap[color],
          mt: 0.5,
        }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 6,
      }}
    >
      <CircularProgress
        size={48}
        sx={{ color: palette.accent[500], mb: 2 }}
      />
      <Typography
        variant="body1"
        sx={{ fontWeight: 500, color: textColors.primary, mb: 0.5 }}
      >
        {message}
      </Typography>
      <Typography variant="body2" sx={{ color: textColors.secondary }}>
        Please wait while we fetch your data...
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: palette.accent[500],
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

function ExecutionWarning({ rowCount }: { rowCount: number }) {
  const isLarge = rowCount > 1000;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        backgroundColor: isLarge ? palette.warning[50] : palette.accent[50],
        border: `1px solid ${isLarge ? palette.warning[200] : palette.accent[200]}`,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Warning
          sx={{
            color: isLarge ? palette.warning[600] : palette.accent[600],
            fontSize: 20,
            mt: 0.25,
          }}
        />
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isLarge ? palette.warning[800] : palette.accent[800],
              mb: 0.5,
            }}
          >
            {isLarge ? 'Large Dataset Notice' : 'Ready to Process'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: textColors.secondary, fontSize: '0.8125rem' }}
          >
            {isLarge
              ? `Processing ${rowCount.toLocaleString()} records may take 5-10 minutes.`
              : `${rowCount.toLocaleString()} records will be enriched and validated.`}
          </Typography>
          {isLarge && (
            <Box
              component="ul"
              sx={{
                m: 0,
                mt: 1,
                pl: 2.5,
                '& li': {
                  fontSize: '0.75rem',
                  color: textColors.secondary,
                  mb: 0.25,
                },
              }}
            >
              <li>idiCORE phone/email lookup</li>
              <li>CCC Litigator API check</li>
              <li>DNC database validation</li>
              <li>Snowflake upload</li>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SampleDataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const displayRows = rows.slice(0, MAX_SAMPLE_ROWS);
  const columns = Object.keys(displayRows[0] || {}).slice(0, 6); // Show first 6 columns

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          color: textColors.primary,
          mb: 1,
          fontSize: '0.8125rem',
        }}
      >
        Sample Data ({Math.min(rows.length, MAX_SAMPLE_ROWS)} of {rows.length} rows)
      </Typography>
      <TableContainer
        sx={{
          borderRadius: 1.5,
          border: `1px solid ${borderColors.default}`,
          maxHeight: 280,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: textColors.secondary,
                    backgroundColor: backgrounds.secondary,
                    py: 1,
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((row, idx) => (
              <TableRow key={idx} hover>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      fontSize: '0.8125rem',
                      color: textColors.primary,
                      py: 0.75,
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col])
                      : '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/**
 * Compact preview dialog for ETL jobs
 */
export function PreviewDialogCompact({
  open,
  isForExecution = false,
  isLoading = false,
  loadingMessage = 'Loading preview...',
  error,
  data,
  rowLimit,
  onClose,
  onExecute,
}: PreviewDialogCompactProps) {
  const rowsToProcess = data
    ? rowLimit
      ? Math.min(rowLimit, data.unprocessed)
      : data.unprocessed
    : 0;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid ${borderColors.light}`,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: textColors.primary }}
          >
            {isForExecution ? 'Confirm ETL Job' : 'Preview'}
          </Typography>
          {data && (
            <Typography
              variant="body2"
              sx={{ color: textColors.secondary, mt: 0.25 }}
            >
              {data.scriptName}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          size="small"
          sx={{ color: textColors.secondary }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ py: 3 }}>
        {isLoading ? (
          <LoadingState message={loadingMessage} />
        ) : error ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 1.5,
              backgroundColor: palette.error[50],
              border: `1px solid ${palette.error[200]}`,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: palette.error[700], fontWeight: 500 }}>
              {error}
            </Typography>
          </Box>
        ) : data ? (
          <>
            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <StatCard label="Total Rows" value={data.totalRows} />
              <StatCard
                label="Already Processed"
                value={data.alreadyProcessed}
                color="info"
              />
              <StatCard
                label="To Process"
                value={data.unprocessed}
                color="success"
              />
            </Box>

            {/* Row limit indicator */}
            {rowLimit && rowLimit < data.unprocessed && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: palette.accent[50],
                  border: `1px solid ${palette.accent[200]}`,
                }}
              >
                <CheckCircle sx={{ color: palette.accent[600], fontSize: 18 }} />
                <Typography
                  variant="body2"
                  sx={{ color: palette.accent[800] }}
                >
                  Limited to <strong>{rowLimit.toLocaleString()}</strong> rows
                  (of {data.unprocessed.toLocaleString()} available)
                </Typography>
              </Box>
            )}

            {/* Execution warning */}
            {isForExecution && <ExecutionWarning rowCount={rowsToProcess} />}

            {/* Sample data */}
            {data.sampleRows && data.sampleRows.length > 0 && (
              <SampleDataTable rows={data.sampleRows} />
            )}

            {/* No sample data message */}
            {(!data.sampleRows || data.sampleRows.length === 0) && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 1.5,
                  backgroundColor: backgrounds.secondary,
                  border: `1px solid ${borderColors.default}`,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: textColors.secondary }}
                >
                  No sample data available. Set a row limit to preview actual
                  records.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ color: textColors.secondary }}>
              No preview data available
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${borderColors.light}`,
          gap: 1,
        }}
      >
        {isForExecution ? (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="accent"
              startIcon={<PlayArrow />}
              onClick={onExecute}
              disabled={isLoading || !data || rowsToProcess === 0}
            >
              {isLoading
                ? 'Loading...'
                : `Run ETL (${rowsToProcess.toLocaleString()} rows)`}
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

export default PreviewDialogCompact;
