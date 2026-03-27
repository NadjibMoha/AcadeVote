import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('username', res.data.user.username);
      
      showToast(`Welcome back, ${res.data.user.username}!`, 'success');
      
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'auditor') navigate('/auditor');
      else navigate('/voter');
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ maxWidth: 400, width: '100%', p: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>AcadeVote 🎓</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Blockchain-backed Academic Elections
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || !username || !password}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
