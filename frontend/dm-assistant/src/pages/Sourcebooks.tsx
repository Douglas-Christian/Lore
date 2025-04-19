import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Box,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { getSourcebooks, uploadSourcebook, deleteSourcebook, searchSourcebooks } from '../services/api';
import { Sourcebook, SearchResult } from '../types';

const Sourcebooks: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcebooks, setSourcebooks] = useState<Sourcebook[]>([]);
  const [openUploadDialog, setOpenUploadDialog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch sourcebooks when component mounts
    fetchSourcebooks();
  }, []);

  const fetchSourcebooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSourcebooks();
      setSourcebooks(data);
    } catch (err: any) {
      console.error('Error fetching sourcebooks:', err);
      setError(`Failed to load sourcebooks: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadDialog = () => {
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    setUploadLoading(true);
    setError(null);
    
    try {
      await uploadSourcebook(file);
      fetchSourcebooks(); // Refresh the list after upload
      handleCloseUploadDialog();
    } catch (err: any) {
      setError(`Failed to upload file: ${err.message || 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    setSearchLoading(true);
    setError(null);
    
    try {
      const results = await searchSourcebooks(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(`Search failed: ${err.message || 'Unknown error'}`);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDeleteSourcebook = async (filename: string) => {
    try {
      setError(null);
      await deleteSourcebook(filename);
      fetchSourcebooks(); // Refresh the list after deletion
    } catch (err: any) {
      setError(`Failed to delete sourcebook: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Sourcebooks
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Available Sourcebooks</Typography>
              <Button 
                variant="contained" 
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenUploadDialog}
              >
                Upload
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : sourcebooks.length === 0 ? (
              <Alert severity="info">
                No sourcebooks available. Upload your first sourcebook to get started.
              </Alert>
            ) : (
              <List>
                {sourcebooks.map((book, index) => (
                  <React.Fragment key={index}>
                    <ListItem 
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDeleteSourcebook(book.filename)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText 
                        primary={book.filename} 
                        secondary={`${(book.size / 1024).toFixed(2)} KB • ${new Date(book.created_at).toLocaleDateString()}`} 
                      />
                    </ListItem>
                    {index < sourcebooks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Search Sourcebooks
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 3 }}>
              <TextField 
                fullWidth 
                variant="outlined"
                label="Search Query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ ml: 1 }}
                onClick={handleSearch}
                disabled={searchLoading}
              >
                {searchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
              </Button>
            </Box>
            
            {searchResults && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">
                  Search Results for: "{searchResults.query}"
                </Typography>
                
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
                  {searchResults.results.documents.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No results found for your query. Try different keywords.
                    </Alert>
                  ) : (
                    searchResults.results.documents.map((doc: string, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText 
                            primary={searchResults.results.metadatas[index].filename}
                            secondary={doc.length > 200 ? `${doc.slice(0, 200)}...` : doc}
                          />
                        </ListItem>
                        {index < searchResults.results.documents.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Sourcebook</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload PDF, Word documents, or text files containing your D&D sourcebook content.
          </Typography>
          
          {uploadLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              Choose File
              <input 
                type="file" 
                hidden 
                accept=".pdf,.docx,.doc,.txt" 
                onChange={handleFileUpload}
              />
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploadLoading}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Sourcebooks;