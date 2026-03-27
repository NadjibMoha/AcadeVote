import React from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PeopleIcon from '@mui/icons-material/People';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ role, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Create Election', icon: <AddBoxIcon />, path: '/admin/create' },
    { text: 'Manage Elections', icon: <FormatListBulletedIcon />, path: '/admin/manage' },
    { text: 'Voter Management', icon: <PeopleIcon />, path: '/admin/voters' },
  ];

  const auditorMenuItems = [
    { text: 'Audit Dashboard', icon: <DashboardIcon />, path: '/auditor' },
    { text: 'Audit Logs', icon: <HistoryEduIcon />, path: '/auditor/logs' },
  ];

  const items = role === 'admin' ? adminMenuItems : auditorMenuItems;

  return (
    <div>
      <List>
        {items.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path} 
              onClick={() => handleNav(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(21, 101, 192, 0.08)',
                  borderRight: '4px solid #1565C0'
                }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </div>
  );
};

export default Sidebar;
