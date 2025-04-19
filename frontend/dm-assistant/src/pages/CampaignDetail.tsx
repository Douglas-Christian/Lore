import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Tabs, Tab, Paper, Button, TextField,
  CircularProgress, Alert, List, ListItem, ListItemText, Card,
  CardContent, Grid
} from '@mui/material';
import { Campaign, NarrationLog, Session } from '../types';
import { getCampaign, getNarrationLogs, getSessions, createNarrationLog } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`campaign-tabpanel-${index}`}
      aria-labelledby={`campaign-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0');
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [narrationLogs, setNarrationLogs] = useState<NarrationLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  
  const [newNarration, setNewNarration] = useState<string>('');
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch campaign details
      const campaignData = await getCampaign(campaignId);
      setCampaign(campaignData);
      
      // Fetch narration logs
      const narrationLogsData = await getNarrationLogs(campaignId);
      setNarrationLogs(narrationLogsData);
      
      // Fetch sessions
      const sessionsData = await getSessions(campaignId);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to fetch campaign data:', err);
      setError('Failed to load campaign details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId <= 0) {
      setError('Invalid campaign ID');
      setLoading(false);
      return;
    }
    
    fetchCampaignData();
  }, [campaignId, fetchCampaignData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const validateNarration = (text: string): boolean => {
    if (!text.trim()) {
      setNarrationError('Narration content is required');
      return false;
    }
    setNarrationError(null);
    return true;
  };

  const handleSubmitNarration = async () => {
    if (!validateNarration(newNarration)) {
      return;
    }

    try {
      setSubmitting(true);
      setNarrationError(null);
      
      const newLog = await createNarrationLog(campaignId, newNarration);
      setNarrationLogs([...narrationLogs, newLog]);
      setNewNarration('');
    } catch (err) {
      console.error('Failed to add narration log:', err);
      setNarrationError('Failed to add narration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = () => {
    navigate(`/campaigns/${campaignId}/session`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!campaign) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Campaign not found
      </Alert>
    );
  }

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {campaign.name}
        </Typography>
        {campaign.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {campaign.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Created: {new Date(campaign.created_at).toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="campaign tabs">
            <Tab label="Narration Logs" id="campaign-tab-0" aria-controls="campaign-tabpanel-0" />
            <Tab label="Sessions" id="campaign-tab-1" aria-controls="campaign-tabpanel-1" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {/* Narration Logs Tab */}
          <Grid container spacing={2}>
            <Grid sx={{ width: '100%', p: 1 }}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Add New Narration
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Narration content"
                    value={newNarration}
                    onChange={(e) => setNewNarration(e.target.value)}
                    error={!!narrationError}
                    helperText={narrationError}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmitNarration}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Add Narration'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid sx={{ width: '100%', p: 1 }}>
              <Typography variant="h6" gutterBottom>
                Narration History
              </Typography>
              {narrationLogs.length === 0 ? (
                <Alert severity="info">
                  No narration logs yet. Add your first narration to get started.
                </Alert>
              ) : (
                <List>
                  {narrationLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <Paper elevation={1} sx={{ mb: 2, p: 2 }}>
                        <Typography variant="body1">
                          {log.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Added: {new Date(log.created_at).toLocaleString()}
                        </Typography>
                      </Paper>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {/* Sessions Tab */}
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleStartSession}
            >
              Start New Session
            </Button>
          </Box>
          
          {sessions.length === 0 ? (
            <Alert severity="info">
              No sessions yet. Start your first session with this campaign.
            </Alert>
          ) : (
            <List>
              {sessions.map((session) => (
                <ListItem 
                  key={session.id} 
                  divider
                  onClick={() => navigate(`/campaigns/${campaignId}/session/${session.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={`Session #${session.id}`}
                    secondary={`Started: ${new Date(session.start_time).toLocaleString()} ${session.end_time ? 
                      `- Ended: ${new Date(session.end_time).toLocaleString()}` : '(In progress)'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Box>
    </div>
  );
};

export default CampaignDetail;