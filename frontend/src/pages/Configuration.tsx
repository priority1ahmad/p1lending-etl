import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Save, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '../services/api/config';

export const Configuration: React.FC = () => {
  const queryClient = useQueryClient();
  const [idicoreClientId, setIdicoreClientId] = useState('');
  const [idicoreClientSecret, setIdicoreClientSecret] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => configApi.get(),
  });

  useEffect(() => {
    if (config) {
      setIdicoreClientId(config.idicore_client_id || '');
      setIdicoreClientSecret(config.idicore_client_secret || '');
      setGoogleSheetUrl(config.google_sheet_url || '');
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => configApi.update({ config: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setSaveStatus({ success: true, message: 'Configuration saved successfully' });
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: (error: any) => {
      setSaveStatus({ 
        success: false, 
        message: error.response?.data?.detail || 'Failed to save configuration' 
      });
      // Clear error message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000);
    },
  });

  const testIdiCOREMutation = useMutation({
    mutationFn: () => configApi.testIdiCORE(),
    onSuccess: (data) => {
      setTestResults((prev) => ({ ...prev, idicore: data }));
    },
  });

  const testSnowflakeMutation = useMutation({
    mutationFn: () => configApi.testSnowflake(),
    onSuccess: (data) => {
      setTestResults((prev) => ({ ...prev, snowflake: data }));
    },
  });

  const testGoogleSheetsMutation = useMutation({
    mutationFn: () => configApi.testGoogleSheets(),
    onSuccess: (data) => {
      setTestResults((prev) => ({ ...prev, googleSheets: data }));
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      idicore_client_id: idicoreClientId,
      idicore_client_secret: idicoreClientSecret,
      google_sheet_url: googleSheetUrl,
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          mb: 4,
          fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
          fontWeight: 700,
          color: '#1E3A5F',
        }}
      >
        Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* idiCORE API Configuration */}
        {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                idiCORE API
              </Typography>
              <TextField
                fullWidth
                label="Client ID"
                value={idicoreClientId}
                onChange={(e) => setIdicoreClientId(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Client Secret"
                type="password"
                value={idicoreClientSecret}
                onChange={(e) => setIdicoreClientSecret(e.target.value)}
                margin="normal"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => testIdiCOREMutation.mutate()}
                  disabled={testIdiCOREMutation.isPending}
                  sx={{
                    borderColor: '#1E3A5F',
                    color: '#1E3A5F',
                    borderWidth: '2px',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    '&:hover': {
                      borderWidth: '2px',
                      backgroundColor: '#1E3A5F',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {testIdiCOREMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Save />} 
                  onClick={handleSave}
                  sx={{
                    background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                    color: '#FFFFFF',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                      boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Save
                </Button>
              </Box>
              {saveStatus && (
                <Alert
                  severity={saveStatus.success ? 'success' : 'error'}
                  icon={saveStatus.success ? <CheckCircle /> : <ErrorIcon />}
                  sx={{ mt: 2 }}
                >
                  {saveStatus.message}
                </Alert>
              )}
              {testResults.idicore && (
                <Alert
                  severity={testResults.idicore.success ? 'success' : 'error'}
                  icon={testResults.idicore.success ? <CheckCircle /> : <ErrorIcon />}
                  sx={{ mt: 2 }}
                >
                  {testResults.idicore.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Google Sheets Configuration */}
        {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                Google Sheets
              </Typography>
              <TextField
                fullWidth
                label="Sheet URL"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                margin="normal"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => testGoogleSheetsMutation.mutate()}
                  disabled={testGoogleSheetsMutation.isPending}
                  sx={{
                    borderColor: '#1E3A5F',
                    color: '#1E3A5F',
                    borderWidth: '2px',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    '&:hover': {
                      borderWidth: '2px',
                      backgroundColor: '#1E3A5F',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {testGoogleSheetsMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Save />} 
                  onClick={handleSave}
                  sx={{
                    background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                    color: '#FFFFFF',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E8632B 0%, #F07D4A 100%)',
                      boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Save
                </Button>
              </Box>
              {saveStatus && (
                <Alert
                  severity={saveStatus.success ? 'success' : 'error'}
                  icon={saveStatus.success ? <CheckCircle /> : <ErrorIcon />}
                  sx={{ mt: 2 }}
                >
                  {saveStatus.message}
                </Alert>
              )}
              {testResults.googleSheets && (
                <Alert
                  severity={testResults.googleSheets.success ? 'success' : 'error'}
                  icon={testResults.googleSheets.success ? <CheckCircle /> : <ErrorIcon />}
                  sx={{ mt: 2 }}
                >
                  {testResults.googleSheets.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Snowflake Configuration (Read Only) */}
        {/* @ts-expect-error - Material-UI v7 Grid item prop type issue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}
              >
                Snowflake (Read Only)
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  color: '#4A5568',
                  fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                }}
              >
                Snowflake configuration is managed via environment variables and cannot be edited here.
              </Typography>
              <TextField
                fullWidth
                label="Account"
                value={config?.snowflake_account || ''}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="User"
                value={config?.snowflake_user || ''}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="Database"
                value={config?.snowflake_database || ''}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="Schema"
                value={config?.snowflake_schema || ''}
                margin="normal"
                disabled
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => testSnowflakeMutation.mutate()}
                  disabled={testSnowflakeMutation.isPending}
                  sx={{
                    borderColor: '#1E3A5F',
                    color: '#1E3A5F',
                    borderWidth: '2px',
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    '&:hover': {
                      borderWidth: '2px',
                      backgroundColor: '#1E3A5F',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {testSnowflakeMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
              </Box>
              {testResults.snowflake && (
                <Alert
                  severity={testResults.snowflake.success ? 'success' : 'error'}
                  icon={testResults.snowflake.success ? <CheckCircle /> : <ErrorIcon />}
                  sx={{ mt: 2 }}
                >
                  {testResults.snowflake.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

