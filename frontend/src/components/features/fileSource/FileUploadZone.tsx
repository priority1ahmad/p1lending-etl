/**
 * File Upload Zone Component
 * Drag-and-drop file upload with validation for Excel and CSV files
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { palette, textColors, borderColors } from '../../../theme';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string;
  selectedFile?: File | null;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploadZone({
  onFileSelect,
  onFileRemove,
  uploadProgress,
  isUploading = false,
  error,
  selectedFile,
  accept = '.xlsx,.xls,.csv',
  maxSizeMB = 50,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setValidationError(null);

      // Check file type
      const allowedExtensions = accept.split(',').map((ext) => ext.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        setValidationError(`Invalid file type. Allowed types: ${accept}`);
        return false;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setValidationError(`File size exceeds ${maxSizeMB}MB limit`);
        return false;
      }

      return true;
    },
    [accept, maxSizeMB]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, validateFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, validateFile]
  );

  const handleRemoveFile = useCallback(() => {
    setValidationError(null);
    onFileRemove?.();
  }, [onFileRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayError = error || validationError;

  return (
    <Box>
      {!selectedFile ? (
        <Paper
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${
              isDragging
                ? palette.accent[500]
                : displayError
                ? palette.error[400]
                : borderColors.default
            }`,
            borderRadius: 3,
            padding: 6,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging
              ? palette.accent[50]
              : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: palette.accent[400],
              backgroundColor: palette.accent[50],
            },
          }}
          onClick={() => {
            if (!isUploading) {
              document.getElementById('file-upload-input')?.click();
            }
          }}
        >
          <input
            id="file-upload-input"
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={isUploading}
          />

          {isUploading ? (
            <Box>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ color: textColors.secondary, mb: 1 }}>
                Uploading and processing file...
              </Typography>
              {uploadProgress !== undefined && (
                <Typography variant="body2" sx={{ color: textColors.tertiary }}>
                  {uploadProgress}%
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <UploadIcon
                sx={{
                  fontSize: 64,
                  color: displayError ? palette.error[400] : palette.accent[400],
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{ color: textColors.primary, mb: 1, fontWeight: 600 }}
              >
                {isDragging ? 'Drop file here' : 'Upload Excel or CSV file'}
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.secondary, mb: 2 }}>
                Drag and drop your file here, or click to browse
              </Typography>
              <Typography variant="caption" sx={{ color: textColors.tertiary }}>
                Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                <br />
                Maximum file size: {maxSizeMB}MB
              </Typography>
            </Box>
          )}
        </Paper>
      ) : (
        <Paper
          sx={{
            border: `1px solid ${borderColors.default}`,
            borderRadius: 2,
            padding: 3,
            backgroundColor: palette.accent[50],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileIcon sx={{ fontSize: 40, color: palette.accent[600] }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                sx={{ color: textColors.primary, fontWeight: 500 }}
              >
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.secondary }}>
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            {!isUploading && (
              <IconButton
                onClick={handleRemoveFile}
                size="small"
                sx={{
                  color: textColors.secondary,
                  '&:hover': {
                    color: palette.error[500],
                    backgroundColor: palette.error[50],
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Paper>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {displayError}
        </Alert>
      )}
    </Box>
  );
}
