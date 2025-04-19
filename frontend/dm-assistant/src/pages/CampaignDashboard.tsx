import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, Button, Card, CardContent, CardActions, 
  Grid, CircularProgress, Alert, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Campaign } from '../types';
import { getCampaigns, createCampaign } from '../services/api';

const CampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [newCampaignDescription, setNewCampaignDescription] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('Starting fetchCampaigns...');
      setLoading(true);
      setError(null);
      const fetchedCampaigns = await getCampaigns();
      console.log('Campaigns fetched successfully:', fetchedCampaigns);
      setCampaigns(fetchedCampaigns);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
    setNewCampaignName('');
    setNewCampaignDescription('');
    setNameError(null);
    setCreateError(null);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const validateCampaignName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Campaign name is required');
      return false;
    }
    if (name.length > 255) {
      setNameError('Campaign name must be less than 255 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleCreateCampaign = async () => {
    if (!validateCampaignName(newCampaignName)) {
      console.log('Campaign name validation failed');
      return;
    }

    try {
      console.log('Attempting to create campaign...');
      setCreateError(null);
      const description = newCampaignDescription.trim() || undefined;
      console.log('Sending campaign data:', { name: newCampaignName, description });
      const campaign = await createCampaign(newCampaignName, description);
      console.log('Campaign created successfully:', campaign);
      setCampaigns([...campaigns, campaign]);
      handleDialogClose();
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      setCreateError(`Failed to create campaign: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            Your Campaigns
          </Typography>
        </Grid>
        <Grid>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleDialogOpen}
          >
            New Campaign
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <CircularProgress />
        </div>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : campaigns.length === 0 ? (
        <Alert severity="info">
          You don't have any campaigns yet. Create your first campaign to get started.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }} key={campaign.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {campaign.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {campaign.description || 'No description provided.'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/campaigns/${campaign.id}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    color="secondary" 
                    component={Link} 
                    to={`/campaigns/${campaign.id}/session`}
                  >
                    Start Session
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Campaign Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newCampaignDescription}
            onChange={(e) => setNewCampaignDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleCreateCampaign} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CampaignDashboard;