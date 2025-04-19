import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography, Box, Grid, Paper, TextField, Button, CircularProgress,
  Alert, Chip, Card, CardContent, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { Campaign, NarrationLog, LLMQueryResponse } from '../types';
import { getCampaign, getNarrationLogs, createNarrationLog, queryLLM, retrieveContent, startSession } from '../services/api';

const SessionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0');
  const narrationEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [narrationLogs, setNarrationLogs] = useState<NarrationLog[]>([]);
  
  const [prompt, setPrompt] = useState<string>('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [llmResponse, setLlmResponse] = useState<LLMQueryResponse | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch campaign details
      const campaignData = await getCampaign(campaignId);
      setCampaign(campaignData);
      
      // Fetch narration logs
      const narrationLogsData = await getNarrationLogs(campaignId);
      setNarrationLogs(narrationLogsData);
      
      // Start a new session if navigated directly
      try {
        await startSession(campaignId);
      } catch (sessionErr) {
        console.warn('Could not start a new session:', sessionErr);
        // Continue anyway, not critical
      }
    } catch (err) {
      console.error('Failed to fetch session data:', err);
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
    
    fetchSessionData();
  }, [campaignId, fetchSessionData]);

  useEffect(() => {
    // Scroll to the bottom when new narration is added
    if (narrationEndRef.current) {
      narrationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [narrationLogs]);

  const validatePrompt = (text: string): boolean => {
    if (!text.trim()) {
      setPromptError('Prompt is required');
      return false;
    }
    setPromptError(null);
    return true;
  };

  const handleSubmitPrompt = async () => {
    if (!validatePrompt(prompt)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setPromptError(null);
      
      // Query the LLM with campaign context
      const response = await queryLLM(prompt, campaignId);
      setLlmResponse(response);
      
      // Reset prompt
      setPrompt('');
    } catch (err) {
      console.error('Failed to query LLM:', err);
      setPromptError('Failed to get a response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNarration = async (content: string) => {
    if (!content.trim()) {
      return;
    }

    try {
      const newLog = await createNarrationLog(campaignId, content);
      setNarrationLogs([...narrationLogs, newLog]);
      setLlmResponse(null); // Clear the response after adding it as narration
    } catch (err) {
      console.error('Failed to add narration log:', err);
      // We already show the error in the LLM response section
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Search query is required');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      const results = await retrieveContent(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search content:', err);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Session: {campaign.name}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left column: Narration History */}
        <Grid sx={{ width: { xs: '100%', md: '58.33%' }, p: 1 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Narration History</Typography>
                <Tooltip title="Refresh narration logs">
                  <IconButton 
                    size="small" 
                    onClick={() => getNarrationLogs(campaignId).then(logs => setNarrationLogs(logs))}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box 
                sx={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  mb: 2,
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}
              >
                {narrationLogs.length === 0 ? (
                  <Alert severity="info">
                    No narration logs yet. Start by adding your first narration.
                  </Alert>
                ) : (
                  narrationLogs.map((log) => (
                    <Paper 
                      key={log.id} 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body1">
                        {log.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))
                )}
                <div ref={narrationEndRef} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: LLM Query and Search */}
        <Grid sx={{ width: { xs: '100%', md: '41.66%' }, p: 1 }}>
          {/* Prompt Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ask for assistance
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="What would you like help with?"
                placeholder="Describe a situation, ask for ideas, request NPC dialogue..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                error={!!promptError}
                helperText={promptError}
                sx={{ mb: 2 }}
                disabled={isSubmitting}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmitPrompt}
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Get Assistance'}
              </Button>
            </CardContent>
          </Card>

          {/* LLM Response Section */}
          {llmResponse && (
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 3, 
                border: llmResponse.error ? '1px solid #f44336' : '1px solid #4caf50',
                bgcolor: llmResponse.error ? 'rgba(244, 67, 54, 0.08)' : 'rgba(76, 175, 80, 0.08)'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {llmResponse.error ? 'Error' : 'Response'}
                  </Typography>
                  {!llmResponse.error && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="secondary"
                      onClick={() => handleAddNarration(llmResponse.response)}
                    >
                      Use as Narration
                    </Button>
                  )}
                </Box>
                
                {llmResponse.error ? (
                  <Alert severity="error">
                    {llmResponse.error}
                    {llmResponse.fallback_response && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {llmResponse.fallback_response}
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                      {llmResponse.response}
                    </Typography>
                    {llmResponse.context_note && (
                      <Chip 
                        label={llmResponse.context_note} 
                        size="small" 
                        color="info" 
                        variant="outlined"
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search Section */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Search Sourcebooks</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Search query"
                  placeholder="Search for monsters, locations, rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  error={!!searchError}
                  helperText={searchError}
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        onClick={handleSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? <CircularProgress size={24} /> : <SearchIcon />}
                      </IconButton>
                    )
                  }}
                />
              </Box>
              
              {searchResults && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Results for: {searchResults.query}
                  </Typography>
                  
                  {searchResults.results && searchResults.results.documents && searchResults.results.documents[0] && searchResults.results.documents[0].length > 0 ? (
                    searchResults.results.documents[0].map((doc: any, index: number) => (
                      <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body2">
                          {doc.length > 300 ? `${doc.substring(0, 300)}...` : doc}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Source: {searchResults.results.metadatas && searchResults.results.metadatas[0] ? 
                            searchResults.results.metadatas[0][index]?.filename || 'Unknown' : 'Unknown'}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      No results found for your query.
                    </Alert>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SessionView;