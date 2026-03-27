import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, Paper, IconButton, Divider } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';

const CreateElectionPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(dayjs().add(1, 'day'));
  const [endTime, setEndTime] = useState(dayjs().add(2, 'days'));
  const [candidates, setCandidates] = useState([
    { id: 1, name: '', description: '' },
    { id: 2, name: '', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleAddCandidate = () => {
    setCandidates([...candidates, { id: Date.now(), name: '', description: '' }]);
  };

  const handleRemoveCandidate = (id) => {
    if (candidates.length <= 2) {
      showToast('Minimum 2 candidates required.', 'warning');
      return;
    }
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const handleCandidateChange = (id, field, value) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const isFormValid = () => {
    if (title.length < 5) return false;
    if (!startTime || !endTime) return false;
    if (endTime.isBefore(startTime)) return false;
    if (startTime.isBefore(dayjs())) return false;
    if (candidates.length < 2) return false;
    if (candidates.some(c => !c.name.trim())) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
      await apiClient.post('/elections', {
        title,
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        candidates: candidates.map(c => ({ name: c.name, description: c.description }))
      });
      showToast('Election created and smart contract deployed successfully!', 'success');
      navigate('/admin/manage');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create election', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">Create New Election</Typography>
      
      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>1. Election Details</Typography>
          <TextField
            fullWidth label="Election Title" variant="outlined" margin="normal"
            value={title} onChange={(e) => setTitle(e.target.value)}
            error={title.length > 0 && title.length < 5}
            helperText={title.length > 0 && title.length < 5 ? "Title must be at least 5 characters" : ""}
            required
          />
          <TextField
            fullWidth label="Description (Optional)" variant="outlined" margin="normal"
            multiline rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>2. Schedule</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Date & Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                disablePast
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="End Date & Time"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                minDateTime={startTime}
                sx={{ width: '100%' }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">3. Candidates</Typography>
            <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={handleAddCandidate}>
              Add Candidate
            </Button>
          </Box>
          
          {candidates.map((c, index) => (
            <Box key={c.id} sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label={`Candidate ${index + 1} Name`} size="small" required
                    value={c.name} onChange={(e) => handleCandidateChange(c.id, 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField 
                    fullWidth label="Description / Platform" size="small"
                    value={c.description} onChange={(e) => handleCandidateChange(c.id, 'description', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={1} textAlign="center">
                  <IconButton color="error" onClick={() => handleRemoveCandidate(c.id)} disabled={candidates.length <= 2}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Grid>
              </Grid>
              {index < candidates.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Paper>

        <Box textAlign="right">
          <Button variant="contained" size="large" type="submit" disabled={!isFormValid() || loading}>
            {loading ? 'Deploying Smart Contract...' : 'Create Election'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateElectionPage;
