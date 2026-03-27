import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { motion } from 'framer-motion';
import { useToast } from '../../components/common/ToastProvider';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const VoteReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [txHash, setTxHash] = useState(location.state?.txHash || null);
  const [candidateName, setCandidateName] = useState(location.state?.candidateName || null);
  const [loading, setLoading] = useState(!location.state?.txHash);
  const electionId = location.state?.electionId;

  useEffect(() => {
    // If we already have the txHash from navigation state, skip the fetch
    if (txHash) return;
    if (!electionId) { setLoading(false); return; }

    const fetchReceipt = async () => {
      try {
        const res = await apiClient.get(`/elections/${electionId}/vote/status`);
        if (res.data.hasVoted && res.data.txHash) {
          setTxHash(res.data.txHash);
        }
      } catch (err) {
        console.error('Failed to fetch vote receipt:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [electionId, txHash]);

  if (loading) return <LoadingSkeleton variant="detail" />;

  if (!txHash) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6">No receipt found.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/voter')}>Return to Dashboard</Button>
      </Box>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    showToast('Transaction hash copied!', 'success');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 100, mb: 2 }} />
      </motion.div>
      
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Your vote has been recorded!
      </Typography>
      
      {candidateName && (
        <Typography variant="h6" color="text.secondary" gutterBottom>
          You voted for {candidateName}
        </Typography>
      )}

      <Paper elevation={0} sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2, maxWidth: 600, width: '100%', textAlign: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Blockchain Transaction Hash:
        </Typography>
        <Chip 
          label={txHash}
          onClick={handleCopy}
          onDelete={handleCopy}
          deleteIcon={<ContentCopyIcon />}
          sx={{ fontFamily: 'monospace', fontSize: '1rem', p: 1, height: 'auto', mb: 3, maxWidth: '100%', '& .MuiChip-label': { overflowWrap: 'break-word', whiteSpace: 'normal' } }}
        />
        <br />
        <Button 
          variant="outlined" 
          endIcon={<OpenInNewIcon />}
          href={`http://127.0.0.1:8545`} 
          target="_blank"
        >
          Verify on Local Network (Hardhat)
        </Button>
      </Paper>

      <Button variant="contained" size="large" sx={{ mt: 5 }} onClick={() => navigate('/voter')}>
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default VoteReceiptPage;
