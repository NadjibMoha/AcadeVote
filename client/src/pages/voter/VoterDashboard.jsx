import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { useElectionCountdown } from '../../hooks/useElectionCountdown';

const ElectionTimer = ({ start, end }) => {
  const { label, urgent } = useElectionCountdown(start, end);
  return (
    <Typography variant="body2" color={urgent ? 'error.main' : 'text.secondary'} sx={{ fontWeight: urgent ? 'bold' : 'normal' }}>
      {label}
    </Typography>
  );
};

const VoterDashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await apiClient.get('/elections');
        setElections(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  if (loading) return <LoadingSkeleton variant="elections-list" />;
  
  const activeOrUpcoming = elections.filter(e => e.status === 'active');
  const pastElections = elections.filter(e => e.has_voted === true);

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" gutterBottom>Active Elections</Typography>
        {activeOrUpcoming.length === 0 ? (
          <EmptyState 
            icon={<HowToVoteIcon sx={{ fontSize: 60 }} />}
            title="No Active Elections" 
            description="There are currently no elections open for voting. Check back later." 
          />
        ) : (
          <Grid container spacing={3}>
            {activeOrUpcoming.map(election => (
              <Grid item xs={12} md={4} key={election.election_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{election.title}</Typography>
                      <Chip label="ACTIVE" color="success" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {election.description}
                    </Typography>
                    <ElectionTimer start={election.start_time} end={election.end_time} />
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {election.has_voted ? (
                      <Tooltip title="View Receipt">
                        <Chip clickable label="Already Voted ✓" color="primary" variant="outlined" onClick={() => navigate('/voter/receipt', { state: { electionId: election.election_id } })} />
                      </Tooltip>
                    ) : (
                      <Button variant="contained" fullWidth onClick={() => navigate(`/voter/election/${election.election_id}`)}>
                        Vote Now
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">My Voting History</Typography>
          <Button variant="outlined" onClick={() => navigate('/voter/history')}>View Full History</Button>
        </Box>
        {pastElections.length === 0 ? (
          <Typography variant="body1" color="text.secondary">You haven't participated in any elections yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {pastElections.slice(0, 3).map(election => (
              <Grid item xs={12} key={election.election_id}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{election.title}</Typography>
                      <Typography variant="body2" color="text.secondary">Voted on {new Date(election.start_time).toLocaleDateString()}</Typography>
                    </Box>
                    <Button variant="text" onClick={() => navigate('/voter/receipt', { state: { electionId: election.election_id } })}>View Receipt</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default VoterDashboard;
