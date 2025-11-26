import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { Save, Delete, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../services/api/scripts';
import Editor from '@monaco-editor/react';

export const SqlEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('-- Write your SQL query here\n');
  const [error, setError] = useState<string | null>(null);

  const { data: script, isLoading } = useQuery({
    queryKey: ['script', scriptId],
    queryFn: () => scriptsApi.get(scriptId!),
    enabled: !!scriptId,
  });

  useEffect(() => {
    if (script) {
      setName(script.name);
      setDescription(script.description || '');
      setContent(script.content);
    }
  }, [script]);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; content: string }) => {
      if (scriptId) {
        return scriptsApi.update(scriptId, data);
      } else {
        return scriptsApi.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      navigate('/sql-files');
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save script');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => scriptsApi.delete(scriptId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      navigate('/sql-files');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError('Script name is required');
      return;
    }
    if (!content.trim()) {
      setError('SQL content is required');
      return;
    }
    setError(null);
    saveMutation.mutate({ name, description, content });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            color: '#1E3A5F',
          }}
        >
          {scriptId ? 'Edit SQL Script' : 'New SQL Script'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Script Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
        />
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ height: '600px', border: '1px solid #e0e0e0' }}>
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={content}
            onChange={(value) => setContent(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/sql-files')}
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
          Cancel
        </Button>
        {scriptId && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{
              borderColor: '#E53E3E',
              color: '#E53E3E',
              borderWidth: '2px',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              '&:hover': {
                borderWidth: '2px',
                backgroundColor: '#E53E3E',
                color: '#FFFFFF',
              },
            }}
          >
            Delete
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saveMutation.isPending}
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
            '&:disabled': {
              background: '#CBD5E0',
              color: '#718096',
            },
          }}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Container>
  );
};

