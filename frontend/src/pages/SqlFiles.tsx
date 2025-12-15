/**
 * SQL Files Page
 * List and manage SQL scripts with modern SaaS styling
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Description } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../services/api/scripts';
import type { SQLScript } from '../services/api/scripts';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { textColors, backgrounds, palette } from '../theme';

export function SqlFiles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<SQLScript | null>(null);

  const { data: scripts, isLoading } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scriptsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      setDeleteDialogOpen(false);
      setScriptToDelete(null);
    },
  });

  const handleDeleteClick = (script: SQLScript) => {
    setScriptToDelete(script);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scriptToDelete) {
      deleteMutation.mutate(scriptToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tableCellSx = {
    fontWeight: 600,
    color: textColors.primary,
    fontSize: '0.8125rem',
    py: 1.5,
  };

  const bodyCellSx = {
    color: textColors.secondary,
    fontSize: '0.875rem',
    py: 1.5,
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
        title="SQL Scripts"
        subtitle="Manage your ETL SQL queries"
        actions={
          <Button
            variant="solid"
            colorScheme="accent"
            startIcon={<Add />}
            onClick={() => navigate('/sql-editor')}
          >
            New Script
          </Button>
        }
      />

      {scripts && scripts.length === 0 ? (
        <Card variant="default" padding="lg">
          <EmptyState
            icon={<Description sx={{ fontSize: 64 }} />}
            title="No SQL scripts found"
            description="Create your first SQL script to get started"
            action={
              <Button
                variant="solid"
                colorScheme="accent"
                startIcon={<Add />}
                onClick={() => navigate('/sql-editor')}
              >
                Create Script
              </Button>
            }
            size="lg"
          />
        </Card>
      ) : (
        <Card variant="default" padding="none">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: backgrounds.secondary }}>
                  <TableCell sx={tableCellSx}>Name</TableCell>
                  <TableCell sx={tableCellSx}>Description</TableCell>
                  <TableCell sx={tableCellSx}>Created</TableCell>
                  <TableCell sx={tableCellSx}>Last Modified</TableCell>
                  <TableCell align="right" sx={tableCellSx}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scripts?.map((script) => (
                  <TableRow
                    key={script.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: backgrounds.secondary },
                    }}
                    onClick={() => navigate(`/sql-editor?id=${script.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ fontWeight: 600, color: textColors.primary }}>
                        {script.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      <Box
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {script.description || '—'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontSize: '0.8125rem' }}>
                      {formatDate(script.created_at)}
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontSize: '0.8125rem' }}>
                      {formatDate(script.updated_at)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sql-editor?id=${script.id}`);
                            }}
                            sx={{ color: palette.primary[800] }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(script);
                            }}
                            sx={{ color: palette.error[500] }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete SQL Script</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{scriptToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            colorScheme="error"
            onClick={handleDeleteConfirm}
            loading={deleteMutation.isPending}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
