import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Avatar, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useElectionCountdown } from '../../hooks/useElectionCountdown';

const ElectionTimer = ({ start, end }) => {
  const { label, urgent } = useElectionCountdown(start, end);
  return (
    <Chip 
      label={label} 
      color={urgent ? 'error' : 'primary'} 
      variant={urgent ? 'filled' : 'outlined'} 
      sx={{ fontWeight: 'bold' }} 
    />
  );
};

const ElectionVotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elRes, statusRes] = await Promise.all([
          apiClient.get(`/elections/${id}`),
          apiClient.get(`/elections/${id}/vote/status`)
        ]);
        
        if (statusRes.data.hasVoted) {
          navigate('/voter/receipt', { state: { electionId: id, txHash: statusRes.data.txHash } });
          return;
        }

        setElection(elRes.data);
        setCandidates(elRes.data.candidates || []);
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to load election', 'error');
        navigate('/voter');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, showToast]);

  const handleVote = async () => {
    setVoting(true);
    try {
      const candidatePosition = selectedCandidate.position !== undefined ? selectedCandidate.position : candidates.indexOf(selectedCandidate);
      const res = await apiClient.post(`/elections/${id}/vote`, { candidateId: candidatePosition });
      showToast('Vote successfully recorded on the blockchain!', 'success');
      navigate('/voter/receipt', { state: { electionId: id, txHash: res.data.txHash, candidateName: selectedCandidate.name } });
    } catch (err) {
      showToast(err.response?.data?.error || 'Voting failed', 'error');
      setConfirmOpen(false);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="elections-list" />;
  if (!election) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>{election.title}</Typography>
          <Typography variant="body1" color="text.secondary">{election.description}</Typography>
        </Box>
        <ElectionTimer start={election.start_time} end={election.end_time} />
      </Box>

      <Box sx={{ p: 2, bgcolor: 'rgba(21, 101, 192, 0.08)', borderRadius: 2, mb: 4, display: 'flex', alignItems: 'center' }}>
        <LockIcon color="primary" sx={{ mr: 2 }} />
        <Typography variant="body2" color="primary.dark">
          Your vote is recorded anonymously on the Ethereum blockchain. Your identity is never stored on-chain.
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 3 }}>Select a Candidate</Typography>
      <Grid container spacing={3}>
        {candidates.map((c) => (
          <Grid item xs={12} sm={6} key={c.candidate_id}>
            <Card 
              onClick={() => setSelectedCandidate(c)}
              sx={{ 
                cursor: 'pointer', 
                border: selectedCandidate?.candidate_id === c.candidate_id ? '2px solid #1565C0' : '2px solid transparent',
                transform: selectedCandidate?.candidate_id === c.candidate_id ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s ease-in-out',
                opacity: selectedCandidate && selectedCandidate.candidate_id !== c.candidate_id ? 0.7 : 1,
                position: 'relative'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.light' }}>
                  {c.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.description}</Typography>
                </Box>
                {selectedCandidate?.candidate_id === c.candidate_id && (
                  <CheckCircleIcon color="primary" sx={{ position: 'absolute', top: 16, right: 16, fontSize: 28 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          size="large" 
          disabled={!selectedCandidate || voting}
          onClick={() => setConfirmOpen(true)}
          sx={{ px: 8, py: 1.5, fontSize: '1.1rem' }}
        >
          {voting ? 'Recording on Blockchain...' : 'Cast Vote'}
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Your Vote"
        message={`You are about to vote for ${selectedCandidate?.name}. This action cannot be undone and will be permanently recorded on the blockchain.`}
        onConfirm={handleVote}
        onCancel={() => setConfirmOpen(false)}
        confirmColor="primary"
        confirmText="Confirm & Submit"
      />
    </Box>
  );
};

export default ElectionVotePage;
