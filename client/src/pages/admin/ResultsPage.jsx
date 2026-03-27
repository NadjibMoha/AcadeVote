import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const ResultsPage = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [resParams, elParams] = await Promise.all([
          apiClient.get(`/elections/${id}/results`),
          apiClient.get(`/elections/${id}`)
        ]);
        setResults(resParams.data);
        setElection(elParams.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <LoadingSkeleton variant="elections-list" />;
  if (!election || results.length === 0) return <Typography>Results not available yet.</Typography>;

  const totalVotes = results.reduce((acc, curr) => acc + curr.vote_count, 0);
  const winner = results[0]; // Ordered by vote_count DESC from API

  const downloadCSV = () => {
    const csvRules = ['Candidate,Platform,Votes,Percentage'];
    results.forEach(r => {
      const pct = totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : 0;
      csvRules.push(`"${r.name}","${r.description}",${r.vote_count},${pct}%`);
    });
    const blob = new Blob([csvRules.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${election.title.replace(/\\s+/g, '_')}_results.csv`;
    a.click();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>Official Results</Typography>
        <Typography variant="h6" color="text.secondary">{election.title}</Typography>
      </Box>

      {totalVotes > 0 && winner.vote_count > 0 && (
        <Paper elevation={3} sx={{ p: 4, mb: 5, textAlign: 'center', bgcolor: 'rgba(255, 215, 0, 0.1)', border: '2px solid #FFD700' }}>
          <EmojiEventsIcon sx={{ fontSize: 60, color: '#FFD700', mb: 1 }} />
          <Typography variant="h5" gutterBottom>Winner</Typography>
          <Typography variant="h3" fontWeight="bold" color="primary">{winner.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            {winner.vote_count} votes ({((winner.vote_count / totalVotes) * 100).toFixed(1)}%)
          </Typography>
        </Paper>
      )}

      <Typography variant="h5" gutterBottom>Detailed Breakdown</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell><strong>Candidate</strong></TableCell>
              <TableCell><strong>Platform</strong></TableCell>
              <TableCell align="right"><strong>Votes</strong></TableCell>
              <TableCell align="right"><strong>Percentage</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r, i) => {
              const pct = totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : 0;
              return (
                <TableRow key={i}>
                  <TableCell>
                    {i === 0 && r.vote_count > 0 && <EmojiEventsIcon sx={{ color: '#FFD700', verticalAlign: 'middle', mr: 1, fontSize: 20 }} />}
                    <strong>{r.name}</strong>
                  </TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell align="right">{r.vote_count}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: '100%', maxWidth: 100, mr: 1, bgcolor: '#e0e0e0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, bgcolor: i === 0 ? 'success.main' : 'primary.main', height: '100%' }} />
                      </Box>
                      {pct}%
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outlined" startIcon={<LinkIcon />} href={`http://127.0.0.1:8545`} target="_blank">
          Verify Blockchain Contract
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadCSV}>
          Download CSV Report
        </Button>
      </Box>
    </Box>
  );
};

export default ResultsPage;
