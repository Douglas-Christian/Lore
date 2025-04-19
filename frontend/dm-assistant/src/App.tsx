import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import CampaignDashboard from './pages/CampaignDashboard';
import CampaignDetail from './pages/CampaignDetail';
import SessionView from './pages/SessionView';
import Sourcebooks from './pages/Sourcebooks';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import './App.css';

// Create a dark theme suitable for a DM assistant
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7b1fa2', // Purple
    },
    secondary: {
      main: '#ff9800', // Orange
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/campaigns" replace />} />
            <Route path="campaigns" element={<CampaignDashboard />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="campaigns/:id/session" element={<SessionView />} />
            <Route path="sourcebooks" element={<Sourcebooks />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
