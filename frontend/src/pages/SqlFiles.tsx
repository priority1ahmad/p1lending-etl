import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
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
  Paper,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Description } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../services/api/scripts';
import type { SQLScript } from '../services/api/scripts';

export const SqlFiles: React.FC = () => {
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

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            color: '#1E3A5F',
          }}
        >
          SQL Scripts
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/sql-editor')}
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
          New Script
        </Button>
      </Box>

      {scripts && scripts.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#4A5568',
                }}
              >
                No SQL scripts found
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 3,
                  color: '#718096',
                  fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                }}
              >
                Create your first SQL script to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/sql-editor')}
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
                Create Script
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F7F9FC' }}>
                <TableCell
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                    fontSize: '0.875rem',
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                    fontSize: '0.875rem',
                  }}
                >
                  Description
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                    fontSize: '0.875rem',
                  }}
                >
                  Created
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                    fontSize: '0.875rem',
                  }}
                >
                  Last Modified
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#1E3A5F',
                    fontSize: '0.875rem',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scripts?.map((script) => (
                <TableRow
                  key={script.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: '#FAFBFC' },
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/sql-editor?id=${script.id}`)}
                >
                  <TableCell>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
                        fontWeight: 600,
                        color: '#1E3A5F',
                        fontSize: '0.9rem',
                      }}
                    >
                      {script.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                        color: '#4A5568',
                        fontSize: '0.875rem',
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {script.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                        color: '#718096',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {formatDate(script.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
                        color: '#718096',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {formatDate(script.updated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sql-editor?id=${script.id}`);
                          }}
                          sx={{
                            color: '#1E3A5F',
                            '&:hover': {
                              backgroundColor: 'rgba(30, 58, 95, 0.08)',
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(script);
                          }}
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
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete SQL Script</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{scriptToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
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
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{
              backgroundColor: '#E53E3E',
              fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              '&:hover': {
                backgroundColor: '#C53030',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
