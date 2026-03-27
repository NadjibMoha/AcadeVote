import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import apiClient from '../../services/apiClient';

const AuditorDashboard = () => {
  const [stats, setStats] = useState({ elections: 0, votes: 0 });

  useEffect(() => {
    apiClient.get('/elections').then(res => {
      setStats({ elections: res.data.length, votes: 50 // mocked overall total 
      });
    });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>Audit System Overview</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <GavelIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Total Elections</Typography>
              <Typography variant="h3" fontWeight="bold">{stats.elections}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <HowToVoteIcon sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Total Votes Recorded</Typography>
              <Typography variant="h3" fontWeight="bold">{stats.votes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SecurityIcon sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">System Integrity</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>All OK</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditorDashboard;
