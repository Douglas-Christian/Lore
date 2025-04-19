import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, Paper } from '@mui/material';
import NavigationMenu from './NavigationMenu';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DM Assistant
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <NavigationMenu />
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Paper sx={{ p: 3, mt: 2, mb: 2 }}>
              <Outlet />
            </Paper>
          </Container>
        </Box>
      </Box>
      
      <Box component="footer" sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          DM Assistant © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;