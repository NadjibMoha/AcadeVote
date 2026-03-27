import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Grid, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const actionTypes = ['election_created', 'vote_cast', 'results_published', 'voter_added', 'voter_removed', 'login', 'logout', 'voters_bulk_added'];

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', username: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.action) query.append('action', filters.action);
      if (filters.username) query.append('username', filters.username);
      
      const res = await apiClient.get(`/audit?${query.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleExport = async () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/audit/export?token=${localStorage.getItem('token')}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">System Audit Logs</Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
          Export Logs (CSV)
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Action Type"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <MenuItem value=""><em>All Actions</em></MenuItem>
              {actionTypes.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Username"
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={() => setFilters({ action: '', username: '' })}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell><strong>Timestamp</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Entity</strong></TableCell>
                <TableCell><strong>IP Address</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow hover key={log.log_id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.username}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{log.action}</TableCell>
                  <TableCell>
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    {log.election_title ? ` (${log.election_title})` : ''}
                  </TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>No audit logs found matching criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AuditLogPage;
