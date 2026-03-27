import React from 'react';
import { Skeleton, Box, Stack, Grid, Card, CardContent } from '@mui/material';

const LoadingSkeleton = ({ variant }) => {
  if (variant === 'stats-cards') {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
  
  if (variant === 'elections-list') {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="80%" height={32} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" height={100} sx={{ mt: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'table') {
    return (
      <Box>
        <Skeleton variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />
    </Stack>
  );
};

export default LoadingSkeleton;
