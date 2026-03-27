import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const EmptyState = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      {icon && <Box sx={{ mb: 2, color: 'text.secondary' }}>{icon}</Box>}
      <Typography variant="h5" color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
