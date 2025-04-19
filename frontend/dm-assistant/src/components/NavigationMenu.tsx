import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Drawer, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpIcon from '@mui/icons-material/Help';

const NavigationMenu: React.FC = () => {
  const drawerWidth = 240;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          <ListItem 
            component={NavLink} 
            to="/campaigns"
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              '&.active': {
                backgroundColor: 'action.selected',
              },
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Campaigns" />
          </ListItem>
          
          <ListItem 
            component={NavLink} 
            to="/sourcebooks"
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              '&.active': {
                backgroundColor: 'action.selected',
              },
            }}
          >
            <ListItemIcon>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText primary="Sourcebooks" />
          </ListItem>
        </List>
        
        <Divider />
        
        <List>
          <ListItem 
            component={NavLink} 
            to="/help"
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              '&.active': {
                backgroundColor: 'action.selected',
              },
            }}
          >
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default NavigationMenu;