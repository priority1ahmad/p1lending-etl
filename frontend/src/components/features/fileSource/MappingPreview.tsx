/**
 * Mapping Preview Component
 * Shows sample data with column mapping applied
 */

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { STANDARD_SCHEMA_COLUMNS } from '../../../types/fileSource';
import { palette, textColors, borderColors } from '../../../theme';

interface MappingPreviewProps {
  sampleData: Record<string, unknown>[];
  mapping: Record<string, string>;
  maxRows?: number;
}

export function MappingPreview({
  sampleData,
  mapping,
  maxRows = 5,
}: MappingPreviewProps) {
  const previewData = sampleData.slice(0, maxRows);
  const mappedColumns = Object.entries(mapping).filter(
    ([_, targetCol]) => targetCol && targetCol !== 'custom'
  );

  const getTargetColumnLabel = (targetColumn: string): string => {
    const schemaColumn = STANDARD_SCHEMA_COLUMNS.find(
      (col) => col.value === targetColumn
    );
    return schemaColumn?.label || targetColumn;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  if (mappedColumns.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          border: `1px dashed ${borderColors.default}`,
          borderRadius: 2,
          backgroundColor: palette.gray[50],
        }}
      >
        <Typography variant="body1" sx={{ color: textColors.secondary }}>
          No columns mapped yet. Map at least one column to see the preview.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: textColors.primary, fontWeight: 600 }}>
          Preview Mapped Data
        </Typography>
        <Typography variant="body2" sx={{ color: textColors.secondary, mt: 0.5 }}>
          First {previewData.length} rows with mapping applied
        </Typography>
      </Box>

      {/* Mapping Summary */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: palette.success[50],
          borderRadius: 2,
          border: `1px solid ${palette.success[200]}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CheckIcon sx={{ color: palette.success[600], fontSize: 24 }} />
        <Box>
          <Typography
            variant="body2"
            sx={{ color: palette.success[800], fontWeight: 500 }}
          >
            {mappedColumns.length} columns will be imported
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {mappedColumns.map(([sourceCol, targetCol]) => (
              <Chip
                key={sourceCol}
                label={getTargetColumnLabel(targetCol)}
                size="small"
                sx={{
                  backgroundColor: palette.accent[100],
                  color: palette.accent[800],
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Preview Table */}
      <TableContainer
        component={Paper}
        sx={{
          border: `1px solid ${borderColors.default}`,
          borderRadius: 2,
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  backgroundColor: palette.gray[100],
                  minWidth: 60,
                }}
              >
                #
              </TableCell>
              {mappedColumns.map(([sourceCol, targetCol]) => (
                <TableCell
                  key={sourceCol}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: palette.gray[100],
                    minWidth: 150,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: textColors.primary,
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {getTargetColumnLabel(targetCol)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: textColors.tertiary,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                      }}
                    >
                      from: {sourceCol}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  '&:hover': {
                    backgroundColor: palette.gray[50],
                  },
                }}
              >
                <TableCell
                  sx={{
                    color: textColors.tertiary,
                    fontWeight: 500,
                  }}
                >
                  {rowIndex + 1}
                </TableCell>
                {mappedColumns.map(([sourceCol]) => {
                  const value = row[sourceCol];
                  const isEmpty =
                    value === null || value === undefined || value === '';

                  return (
                    <TableCell
                      key={sourceCol}
                      sx={{
                        color: isEmpty ? textColors.tertiary : textColors.primary,
                        fontStyle: isEmpty ? 'italic' : 'normal',
                      }}
                    >
                      {isEmpty ? 'null' : formatValue(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer note */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: palette.gray[50],
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: textColors.secondary }}>
          This is a preview of how your data will be imported. Only mapped columns will be
          included in the final dataset.
        </Typography>
      </Box>
    </Box>
  );
}
