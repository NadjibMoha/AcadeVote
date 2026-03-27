import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useElectionCountdown } from '../../hooks/useElectionCountdown';

const ElectionTimer = ({ start, end }) => {
  const { label } = useElectionCountdown(start, end);
  return <Typography variant="h6" fontWeight="bold">{label}</Typography>;
};

const ElectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [stats, setStats] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elRes, statRes, voterRes] = await Promise.all([
          apiClient.get(`/elections/${id}`),
          apiClient.get(`/elections/${id}/stats`),
          apiClient.get(`/elections/${id}/voters`)
        ]);
        setElection(elRes.data);
        setStats(statRes.data);
        setVoters(voterRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSkeleton variant="table" />;
  if (!election) return <Typography>Election not found.</Typography>;

  const participation = stats.total_voters > 0 ? ((stats.votes_cast / stats.total_voters) * 100).toFixed(1) : 0;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>{election.title}</Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>{election.description}</Typography>
          <Chip label={election.status.toUpperCase()} color={election.status === 'active' ? 'success' : 'default'} sx={{ mt: 1 }} />
        </Box>
        <Box textAlign="right">
          <Typography variant="body2" color="text.secondary">Time Remaining</Typography>
          <ElectionTimer start={election.start_time} end={election.end_time} />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">Registered Voters</Typography>
            <Typography variant="h3">{stats.total_voters}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">Votes Cast</Typography>
            <Typography variant="h3">{stats.votes_cast}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">Participation</Typography>
            <Typography variant="h3">{participation}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {election.status === 'results_published' && (
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Button variant="contained" size="large" onClick={() => navigate(`/admin/results/${id}`)}>
            View Final Results
          </Button>
        </Box>
      )}

      <Typography variant="h5" gutterBottom>Registered Voters Roster</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Voted At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voters.map(v => (
              <TableRow key={v.user_id}>
                <TableCell>{v.username}</TableCell>
                <TableCell>{v.email}</TableCell>
                <TableCell>
                  <Chip label={v.has_voted ? 'Voted' : 'Not Voted'} color={v.has_voted ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>{v.has_voted ? new Date(v.voted_at).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
            {voters.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">No voters registered for this election.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ElectionDetailPage;
