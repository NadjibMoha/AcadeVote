import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Link } from '@mui/material';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const VoteHistoryPage = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await apiClient.get('/elections');
        setElections(res.data.filter(e => e.has_voted));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  if (loading) return <LoadingSkeleton variant="table" />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Voting History</Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell><strong>Election</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date Voted</strong></TableCell>
                <TableCell><strong>Transaction Hash</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {elections.map((row) => (
                <TableRow hover key={row.election_id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{row.status.replace('_', ' ')}</TableCell>
                  <TableCell>{new Date(row.start_time).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`#`} sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {row.txHash || 'View Receipt'}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {elections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No voting history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default VoteHistoryPage;
