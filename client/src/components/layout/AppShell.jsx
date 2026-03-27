import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Chip, Button, IconButton, Drawer, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';
import ConfirmDialog from '../common/ConfirmDialog';

const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const drawerWidth = 240;

  const getTitle = () => {
    const p = location.pathname;
    if (p.includes('/create')) return 'Create Election';
    if (p.includes('/manage')) return 'Manage Elections';
    if (p.includes('/voters')) return 'Voter Management';
    if (p.includes('/logs')) return 'Audit Logs';
    return 'Dashboard';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && userRole !== 'voter' && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            AcadeVote 🎓
          </Typography>
          {!isMobile && (
            <Typography variant="subtitle1" sx={{ ml: 4 }}>
              {getTitle()}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Chip 
            label={userRole.toUpperCase()} 
            color={userRole === 'admin' ? 'error' : userRole === 'auditor' ? 'warning' : 'success'} 
            size="small" 
            sx={{ mr: 2, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }} 
          />
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {username}
          </Typography>
          <Button color="inherit" onClick={() => setLogoutDialogOpen(true)}>Logout</Button>
        </Toolbar>
      </AppBar>

      {userRole !== 'voter' && (
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <Toolbar />
            <Sidebar role={userRole} onClose={isMobile ? handleDrawerToggle : undefined} />
          </Drawer>
        </Box>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: userRole !== 'voter' ? `calc(100% - ${drawerWidth}px)` : '100%' }, minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Toolbar />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Box>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialogOpen(false)}
        confirmColor="error"
      />
    </Box>
  );
};

export default AppShell;
