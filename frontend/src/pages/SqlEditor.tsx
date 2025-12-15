/**
 * SQL Editor Page
 * Monaco-based SQL editor with modern SaaS styling
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, TextField, Alert, CircularProgress } from '@mui/material';
import { Save, Delete, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../services/api/scripts';
import Editor from '@monaco-editor/react';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { borderColors } from '../theme';

export function SqlEditor() {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title={scriptId ? 'Edit SQL Script' : 'New SQL Script'}
        subtitle={scriptId ? `Editing: ${name || 'Untitled'}` : 'Create a new SQL query'}
        breadcrumbs={[
          { label: 'SQL Scripts', href: '/sql-files' },
          { label: scriptId ? 'Edit Script' : 'New Script' },
        ]}
      />

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="default" padding="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Script Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter a name for your script"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            placeholder="Describe what this script does"
          />
        </Box>
      </Card>

      <Card variant="default" padding="none">
        <Box
          sx={{
            height: 500,
            border: `1px solid ${borderColors.default}`,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
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
              padding: { top: 16 },
            }}
          />
        </Box>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outline"
          startIcon={<Cancel />}
          onClick={() => navigate('/sql-files')}
        >
          Cancel
        </Button>
        {scriptId && (
          <Button
            variant="outline"
            colorScheme="error"
            startIcon={<Delete />}
            onClick={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        )}
        <Button
          variant="solid"
          colorScheme="accent"
          startIcon={<Save />}
          onClick={handleSave}
          loading={saveMutation.isPending}
          loadingText="Saving..."
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}
