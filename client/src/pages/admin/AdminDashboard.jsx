import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LockClockIcon from '@mui/icons-material/LockClock';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card 
    component={motion.div} 
    whileHover={{ y: -5, scale: 1.02 }} 
    sx={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
    onClick={onClick}
    elevation={1}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 2, borderRadius: 2, mr: 3 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>{title}</Typography>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
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

  if (loading) return <LoadingSkeleton variant="stats-cards" />;

  const activeElections = elections.filter(e => e.status === 'active').length;
  const upcomingElections = elections.filter(e => e.status === 'draft').length;
  
  const totalRegisteredVoters = 5; 
  const votesCastToday = 2; 

  const recentElections = elections.slice(0, 5);

  const getStatusColor = (status) => {
    if (status === 'active') return 'success';
    if (status === 'draft') return 'warning';
    if (status === 'closed') return 'error';
    return 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>Dashboard Overview</Typography>
      
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Elections" value={activeElections} icon={<HowToVoteIcon fontSize="large" />} color="success" onClick={() => navigate('/admin/manage')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Registered" value={totalRegisteredVoters} icon={<PeopleIcon fontSize="large" />} color="primary" onClick={() => navigate('/admin/voters')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Votes Cast" value={votesCastToday} icon={<EventAvailableIcon fontSize="large" />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Upcoming/Drafts" value={upcomingElections} icon={<LockClockIcon fontSize="large" />} color="warning" onClick={() => navigate('/admin/manage')} />
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>Recent Elections</Typography>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentElections.map((row) => (
              <TableRow hover key={row.election_id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>
                  <Chip label={row.status.toUpperCase()} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 'bold' }} />
                </TableCell>
                <TableCell>{new Date(row.start_time).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/admin/election/${row.election_id}`)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
            {recentElections.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>No elections found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminDashboard;
