import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F5F7FA' }}>
          <Card elevation={3} sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" color="error" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We encountered an unexpected error while loading this page.
              </Typography>
              <Button variant="contained" color="primary" onClick={this.handleRetry} sx={{ mt: 2, mb: 4 }}>
                Try Again
              </Button>
              {this.state.error && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, textAlign: 'left', overflowX: 'auto' }}>
                  <Typography variant="caption" component="pre" color="error" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
