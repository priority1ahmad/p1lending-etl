/**
 * Column Mapping Table Component
 * Shows source columns mapped to target schema columns
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AutoIcon,
  Clear as ClearIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { STANDARD_SCHEMA_COLUMNS } from '../../../types/fileSource';
import { palette, textColors, borderColors } from '../../../theme';

interface ColumnMappingTableProps {
  detectedColumns: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onAutoMap?: () => void;
  sampleData?: Record<string, unknown>[];
}

export function ColumnMappingTable({
  detectedColumns,
  mapping,
  onMappingChange,
  onAutoMap,
  sampleData,
}: ColumnMappingTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleMappingChange = useCallback(
    (sourceColumn: string, targetColumn: string) => {
      const newMapping = { ...mapping };
      if (targetColumn === 'custom' || targetColumn === '') {
        delete newMapping[sourceColumn];
      } else {
        newMapping[sourceColumn] = targetColumn;
      }
      onMappingChange(newMapping);
    },
    [mapping, onMappingChange]
  );

  const handleClearMapping = useCallback(
    (sourceColumn: string) => {
      const newMapping = { ...mapping };
      delete newMapping[sourceColumn];
      onMappingChange(newMapping);
    },
    [mapping, onMappingChange]
  );

  const getMappedTargetColumns = (): Set<string> => {
    return new Set(Object.values(mapping));
  };

  const getSampleValue = (columnName: string): string => {
    if (!sampleData || sampleData.length === 0) return 'N/A';
    const firstRow = sampleData[0];
    const value = firstRow[columnName];
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string' && value.length > 30) {
      return value.substring(0, 30) + '...';
    }
    return String(value);
  };

  const mappedTargetColumns = getMappedTargetColumns();
  const requiredFields = ['first_name', 'last_name', 'phone'];
  const missingRequired = requiredFields.filter(
    (field) => !mappedTargetColumns.has(field)
  );

  return (
    <Box>
      {/* Header with Auto-map button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: textColors.primary, fontWeight: 600 }}>
            Column Mapping
          </Typography>
          <Typography variant="body2" sx={{ color: textColors.secondary, mt: 0.5 }}>
            Map your file columns to the standard schema
          </Typography>
        </Box>
        {onAutoMap && (
          <Tooltip title="Automatically map columns based on column names">
            <IconButton
              onClick={onAutoMap}
              sx={{
                color: palette.accent[600],
                backgroundColor: palette.accent[50],
                '&:hover': {
                  backgroundColor: palette.accent[100],
                },
              }}
            >
              <AutoIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Validation alerts */}
      {missingRequired.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Required fields missing:
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {missingRequired.map((field) => (
              <Chip
                key={field}
                label={
                  STANDARD_SCHEMA_COLUMNS.find((col) => col.value === field)?.label || field
                }
                size="small"
                color="warning"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Mapping Table */}
      <TableContainer
        sx={{
          border: `1px solid ${borderColors.default}`,
          borderRadius: 2,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Source Column</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sample Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Maps To</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 60 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detectedColumns.map((column, index) => {
              const currentMapping = mapping[column] || '';
              const isRequired = requiredFields.includes(currentMapping);

              return (
                <TableRow
                  key={column}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  sx={{
                    backgroundColor:
                      currentMapping && currentMapping !== 'custom'
                        ? palette.accent[50]
                        : 'transparent',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: textColors.primary,
                          fontWeight: 500,
                        }}
                      >
                        {column}
                      </Typography>
                      {isRequired && (
                        <Chip
                          label="Required"
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem',
                        color: textColors.secondary,
                      }}
                    >
                      {getSampleValue(column)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={currentMapping}
                        onChange={(e) => handleMappingChange(column, e.target.value)}
                        displayEmpty
                        sx={{
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': {
                            py: 1,
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>-- Select target column --</em>
                        </MenuItem>
                        {STANDARD_SCHEMA_COLUMNS.map((option) => {
                          const isAlreadyMapped =
                            mappedTargetColumns.has(option.value) &&
                            currentMapping !== option.value;

                          return (
                            <MenuItem
                              key={option.value}
                              value={option.value}
                              disabled={isAlreadyMapped}
                              sx={{
                                fontSize: '0.875rem',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  width: '100%',
                                }}
                              >
                                <span>{option.label}</span>
                                {isAlreadyMapped && (
                                  <Chip
                                    label="Mapped"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      ml: 1,
                                    }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell>
                    {currentMapping && hoveredRow === index && (
                      <Tooltip title="Clear mapping">
                        <IconButton
                          size="small"
                          onClick={() => handleClearMapping(column)}
                          sx={{
                            color: textColors.secondary,
                            '&:hover': {
                              color: palette.error[500],
                            },
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mapping summary */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: palette.gray[50],
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: textColors.secondary }}>
          <strong>{Object.keys(mapping).length}</strong> of{' '}
          <strong>{detectedColumns.length}</strong> columns mapped
        </Typography>
        {missingRequired.length === 0 && Object.keys(mapping).length > 0 && (
          <Chip
            label="Ready to proceed"
            size="small"
            color="success"
            icon={<AutoIcon />}
          />
        )}
      </Box>
    </Box>
  );
}
