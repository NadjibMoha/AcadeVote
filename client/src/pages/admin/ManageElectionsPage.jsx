import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, Tabs, Tab } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/ToastProvider';

const ManageElectionsPage = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', id: null, title: '' });
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/elections');
      setElections(res.data);
    } catch (err) {
      showToast('Failed to load elections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const executeAction = async () => {
    const { type, id } = confirmDialog;
    try {
      setConfirmDialog({ ...confirmDialog, open: false });
      if (type === 'delete') {
        await apiClient.delete(`/elections/${id}`);
        showToast('Election deleted', 'success');
      } else if (type === 'publish') {
        const res = await apiClient.post(`/elections/${id}/publish-results`);
        showToast('Results published successfully on the blockchain!', 'success');
      }
      fetchElections();
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } 
  };

  const getFilteredElections = () => {
    if (tabValue === 0) return elections;
    const statuses = ['draft', 'active', 'closed', 'results_published'];
    return elections.filter(e => e.status === statuses[tabValue - 1]);
  };

  const filtered = getFilteredElections();

  if (loading) return <LoadingSkeleton variant="table" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Manage Elections</Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All" />
          <Tab label="Draft" />
          <Tab label="Active" />
          <Tab label="Closed" />
          <Tab label="Results Published" />
        </Tabs>

        {filtered.length === 0 ? (
          <EmptyState 
            title="No Elections Found" 
            description="There are no elections matching this filter." 
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                  <TableCell><strong>End Date</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow hover key={row.election_id}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status.toUpperCase().replace('_', ' ')} 
                        color={row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : row.status === 'closed' ? 'error' : 'secondary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{new Date(row.start_time).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(row.end_time).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Detail">
                        <IconButton color="primary" onClick={() => navigate(`/admin/election/${row.election_id}`)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {row.status === 'draft' && (
                        <>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => setConfirmDialog({ open: true, type: 'delete', id: row.election_id, title: row.title })}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {row.status === 'closed' && (
                        <Tooltip title="Publish Results">
                          <IconButton color="secondary" onClick={() => setConfirmDialog({ open: true, type: 'publish', id: row.election_id, title: row.title })}>
                            <PublishIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.type === 'delete' ? 'Delete Election' : 'Publish Results'}
        message={confirmDialog.type === 'delete' 
          ? `Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.` 
          : `Are you sure you want to publish the results for "${confirmDialog.title}" to the blockchain? This action is permanent.`}
        onConfirm={executeAction}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        confirmColor={confirmDialog.type === 'delete' ? 'error' : 'secondary'}
        confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Publish'}
      />
    </Box>
  );
};

export default ManageElectionsPage;
