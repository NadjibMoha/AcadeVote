import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Autocomplete, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const VoterManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [voters, setVoters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voterToRemove, setVoterToRemove] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    apiClient.get('/elections').then(res => {
      const drafts = res.data.filter(e => e.status === 'draft');
      setElections(drafts);
      if (drafts.length > 0) {
        setSelectedElection(drafts[0].election_id);
        fetchVoters(drafts[0].election_id);
      }
    });
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get(`/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchVoters = async (electionId) => {
    if (!electionId) return;
    try {
      const res = await apiClient.get(`/elections/${electionId}/voters`);
      setVoters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleElectionChange = (e) => {
    setSelectedElection(e.target.value);
    fetchVoters(e.target.value);
  };

  const handleAddIndividual = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.post(`/elections/${selectedElection}/voters`, { userId: selectedUser.user_id });
      showToast(`${selectedUser.username} added successfully`, 'success');
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      fetchVoters(selectedElection);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add voter', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvContent(evt.target.result);
      const lines = evt.target.result.split('\n').filter(l => l.trim() !== '');
      const headers = lines[0].split(',');
      const parsed = lines.slice(1).map(l => {
        const parts = l.split(',');
        return { id: parseInt(parts[0]), username: parts[1], email: parts[2] };
      });
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleBulkAdd = async () => {
    try {
      const userIds = csvPreview.map(p => p.id).filter(id => !isNaN(id));
      const res = await apiClient.post(`/elections/${selectedElection}/voters/bulk`, { userIds });
      showToast(res.data.message, 'success');
      setCsvPreview([]);
      setCsvContent('');
      fetchVoters(selectedElection);
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk upload failed', 'error');
    }
  };

  const handleRemoveVoter = async () => {
    try {
      await apiClient.delete(`/elections/${selectedElection}/voters/${voterToRemove}`);
      showToast('Voter removed', 'success');
      fetchVoters(selectedElection);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove voter', 'error');
    } finally {
      setConfirmOpen(false);
    }
  };

  if (elections.length === 0) {
    return <Typography sx={{ mt: 5 }} textAlign="center">No draft elections available for voter management. Votes cannot be modified once active.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight="bold">Voter Management</Typography>
      
      <TextField
        select
        SelectProps={{ native: true }}
        label="Select Draft Election"
        value={selectedElection}
        onChange={handleElectionChange}
        fullWidth
        sx={{ mb: 4 }}
      >
        {elections.map(e => (
          <option key={e.election_id} value={e.election_id}>{e.title}</option>
        ))}
      </TextField>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Add Individually" />
          <Tab label="CSV Upload" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Autocomplete
                sx={{ flexGrow: 1 }}
                options={searchResults}
                getOptionLabel={(option) => `${option.username} (${option.email})`}
                value={selectedUser}
                onChange={(e, newValue) => setSelectedUser(newValue)}
                inputValue={searchQuery}
                onInputChange={(e, newInput) => setSearchQuery(newInput)}
                loading={searching}
                noOptionsText={searchQuery ? "No voters found" : "Type to search..."}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Search voter by username or email"
                    placeholder="e.g. voter1 or voter1@uni.edu"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searching && <CircularProgress color="inherit" size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.user_id}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{option.username}</Typography>
                      <Typography variant="body2" color="text.secondary">{option.email}</Typography>
                    </Box>
                  </li>
                )}
              />
              <Button variant="contained" onClick={handleAddIndividual} disabled={!selectedUser} sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                Add to Election
              </Button>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                Upload CSV
                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                Expected format: userId,username,email
              </Typography>
              
              {csvPreview.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" mb={1}>Preview ({csvPreview.length} voters)</Typography>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {csvPreview.slice(0, 3).map((r, i) => (
                        <TableRow key={i}><TableCell>{r.id}</TableCell><TableCell>{r.username}</TableCell><TableCell>{r.email}</TableCell></TableRow>
                      ))}
                      {csvPreview.length > 3 && <TableRow><TableCell colSpan={3}>...and {csvPreview.length - 3} more</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                  <Button variant="contained" onClick={handleBulkAdd}>Confirm Import</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Typography variant="h6" mb={2}>Current Eligible Voters</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voters.map(v => (
              <TableRow key={v.user_id}>
                <TableCell>{v.user_id}</TableCell>
                <TableCell>{v.username}</TableCell>
                <TableCell>{v.email}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => { setVoterToRemove(v.user_id); setConfirmOpen(true); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {voters.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No voters added.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Voter"
        message="Are you sure you want to remove this voter from the election?"
        onConfirm={handleRemoveVoter}
        onCancel={() => setConfirmOpen(false)}
        confirmColor="error"
        confirmText="Remove"
      />
    </Box>
  );
};

export default VoterManagementPage;
