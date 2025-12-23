/**
 * File Source Editor Page
 * 4-step wizard for creating Excel/CSV file sources with column mapping
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { FileUploadZone } from '../components/features/fileSource/FileUploadZone';
import { ColumnMappingTable } from '../components/features/fileSource/ColumnMappingTable';
import { MappingPreview } from '../components/features/fileSource/MappingPreview';

// API and types
import { fileSourcesApi } from '../services/api/fileSources';
import type { FileUploadResponse } from '../types/fileSource';
import { textColors } from '../theme';

const STEPS = [
  'Source Details',
  'Upload File',
  'Column Mapping',
  'Review & Save',
];

export function FileSourceEditor() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Step state
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Source Details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<FileUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 3: Column Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => fileSourcesApi.upload(file),
    onSuccess: (data) => {
      setUploadData(data);
      setUploadError(null);
      enqueueSnackbar('File uploaded and processed successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      setUploadError(
        error.response?.data?.detail || 'Failed to upload and process file'
      );
      enqueueSnackbar('Failed to upload file', { variant: 'error' });
    },
  });

  // Save file source mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!uploadData) {
        throw new Error('No upload data available');
      }

      return fileSourcesApi.create({
        name,
        description: description || undefined,
        file_type: uploadData.file_type,
        original_filename: uploadData.original_filename,
        column_mapping: columnMapping,
        sample_data: uploadData.sample_data,
        row_count: uploadData.row_count,
      });
    },
    onSuccess: () => {
      enqueueSnackbar('File source created successfully', { variant: 'success' });
      navigate('/file-sources');
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.detail || 'Failed to create file source',
        { variant: 'error' }
      );
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setUploadError(null);
      uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadData(null);
    setUploadError(null);
    setColumnMapping({});
  }, []);

  // Auto-map columns based on column name similarity
  const handleAutoMap = useCallback(() => {
    if (!uploadData) return;

    const autoMapping: Record<string, string> = {};

    uploadData.detected_columns.forEach((column) => {
      const normalized = column.toLowerCase().replace(/[_\s-]/g, '');

      // Simple auto-mapping logic
      if (normalized.includes('firstname') || normalized === 'fname') {
        autoMapping[column] = 'first_name';
      } else if (normalized.includes('lastname') || normalized === 'lname') {
        autoMapping[column] = 'last_name';
      } else if (normalized.includes('fullname') || normalized === 'name') {
        autoMapping[column] = 'full_name';
      } else if (normalized.includes('email') || normalized === 'mail') {
        autoMapping[column] = 'email';
      } else if (normalized.includes('phone') || normalized.includes('tel')) {
        autoMapping[column] = 'phone';
      } else if (normalized.includes('address')) {
        autoMapping[column] = 'address';
      } else if (normalized.includes('city')) {
        autoMapping[column] = 'city';
      } else if (normalized.includes('state')) {
        autoMapping[column] = 'state';
      } else if (normalized.includes('zip') || normalized.includes('postal')) {
        autoMapping[column] = 'zip';
      } else if (normalized.includes('ssn') || normalized.includes('social')) {
        autoMapping[column] = 'ssn';
      } else if (normalized.includes('dob') || normalized.includes('birth')) {
        autoMapping[column] = 'dob';
      } else if (normalized.includes('loan') && normalized.includes('amount')) {
        autoMapping[column] = 'loan_amount';
      } else if (normalized.includes('property') && normalized.includes('value')) {
        autoMapping[column] = 'property_value';
      } else if (normalized.includes('credit')) {
        autoMapping[column] = 'credit_score';
      } else if (normalized.includes('income')) {
        autoMapping[column] = 'income';
      }
    });

    setColumnMapping(autoMapping);
    enqueueSnackbar('Auto-mapping applied', { variant: 'info' });
  }, [uploadData, enqueueSnackbar]);

  // Step validation
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 0: // Source Details
        return name.trim().length > 0;
      case 1: // File Upload
        return uploadData !== null && !uploadMutation.isPending;
      case 2: { // Column Mapping
        const requiredFields = ['first_name', 'last_name', 'phone'];
        const mappedTargets = new Set(Object.values(columnMapping));
        return requiredFields.every((field) => mappedTargets.has(field));
      }
      case 3: // Review
        return true;
      default:
        return false;
    }
  }, [activeStep, name, uploadData, columnMapping, uploadMutation.isPending]);

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      saveMutation.mutate();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCancel = () => {
    navigate('/file-sources');
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" sx={{ mb: 3, color: textColors.primary }}>
              Enter source details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Source Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                placeholder="e.g., Q4 2024 Lead List"
                helperText="A descriptive name for this data source"
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                placeholder="Optional description of this data source..."
                helperText="Additional details about the source"
              />
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: textColors.primary }}>
              Upload your Excel or CSV file
            </Typography>
            <FileUploadZone
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              isUploading={uploadMutation.isPending}
              error={uploadError || undefined}
            />
            {uploadData && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  File processed successfully!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Detected {uploadData.detected_columns.length} columns and{' '}
                  {uploadData.row_count.toLocaleString()} rows
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return uploadData ? (
          <ColumnMappingTable
            detectedColumns={uploadData.detected_columns}
            mapping={columnMapping}
            onMappingChange={setColumnMapping}
            onAutoMap={handleAutoMap}
            sampleData={uploadData.sample_data}
          />
        ) : null;

      case 3:
        return uploadData ? (
          <Box>
            {/* Source summary */}
            <Card sx={{ mb: 3, p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: textColors.primary }}>
                Source Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: textColors.secondary, textTransform: 'uppercase' }}
                  >
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: textColors.primary }}>
                    {name}
                  </Typography>
                </Box>
                {description && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: textColors.secondary, textTransform: 'uppercase' }}
                    >
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: textColors.primary }}>
                      {description}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: textColors.secondary, textTransform: 'uppercase' }}
                  >
                    File
                  </Typography>
                  <Typography variant="body1" sx={{ color: textColors.primary }}>
                    {uploadData.original_filename} ({uploadData.row_count.toLocaleString()}{' '}
                    rows)
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Mapping preview */}
            <MappingPreview
              sampleData={uploadData.sample_data}
              mapping={columnMapping}
            />
          </Box>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="New File Source"
        subtitle="Import data from Excel or CSV files"
        breadcrumbs={[
          { label: 'File Sources', href: '/file-sources' },
          { label: 'New Source' },
        ]}
      />

      {/* Stepper */}
      <Card sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        <Box sx={{ minHeight: 400, py: 3 }}>{renderStepContent()}</Box>

        {/* Navigation buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outline"
            onClick={handleCancel}
            startIcon={<BackIcon />}
          >
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              variant="solid"
              onClick={handleNext}
              disabled={!isStepValid}
              endIcon={activeStep === STEPS.length - 1 ? <SaveIcon /> : <NextIcon />}
              loading={saveMutation.isPending}
            >
              {activeStep === STEPS.length - 1 ? 'Save Source' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
