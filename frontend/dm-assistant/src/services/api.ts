import axios from 'axios';
import { Campaign, NarrationLog, Session, LLMQueryRequest, LLMQueryResponse, Sourcebook } from '../types';

const API_URL = 'http://localhost:8000';

// Enable axios request/response logging
axios.interceptors.request.use(request => {
  console.log('AXIOS REQUEST:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    params: request.params,
    data: request.data
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('AXIOS RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('AXIOS ERROR:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'No request made'
    });
    return Promise.reject(error);
  }
);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Campaign API functions
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    console.log('Fetching campaigns from', `${API_URL}/campaigns/`);
    const response = await api.get('/campaigns/');
    console.log('Campaign response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export const getCampaign = async (id: number): Promise<Campaign> => {
  try {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching campaign ${id}:`, error);
    throw error;
  }
};

export const createCampaign = async (name: string, description?: string): Promise<Campaign> => {
  try {
    console.log('Creating campaign with name:', name, 'description:', description);
    
    // Use URLSearchParams for proper form data encoding
    const params = new URLSearchParams();
    params.append('name', name);
    if (description) {
      params.append('description', description);
    }
    
    // Send as form data with appropriate content type
    const response = await api.post('/campaigns/', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Campaign creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Narration Logs API functions
export const getNarrationLogs = async (campaignId: number): Promise<NarrationLog[]> => {
  try {
    const response = await api.get(`/campaigns/${campaignId}/narration_logs/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching narration logs for campaign ${campaignId}:`, error);
    throw error;
  }
};

export const createNarrationLog = async (campaignId: number, content: string): Promise<NarrationLog> => {
  try {
    // Use URLSearchParams for proper form data encoding
    const params = new URLSearchParams();
    params.append('content', content);
    
    // Send as form data with appropriate content type
    const response = await api.post(`/campaigns/${campaignId}/narration_logs/`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error creating narration log for campaign ${campaignId}:`, error);
    throw error;
  }
};

// Session API functions
export const getSessions = async (campaignId: number): Promise<Session[]> => {
  try {
    const response = await api.get(`/campaigns/${campaignId}/sessions/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sessions for campaign ${campaignId}:`, error);
    throw error;
  }
};

export const startSession = async (campaignId: number): Promise<Session> => {
  try {
    const response = await api.post(`/campaigns/${campaignId}/sessions/`);
    return response.data;
  } catch (error) {
    console.error(`Error starting session for campaign ${campaignId}:`, error);
    throw error;
  }
};

// LLM Query API function
export const queryLLM = async (prompt: string, campaignId?: number): Promise<LLMQueryResponse> => {
  try {
    const data: LLMQueryRequest = { prompt };
    let url = '/llm/query/';
    
    // Add campaign_id as a query parameter if provided
    if (campaignId) {
      url += `?campaign_id=${campaignId}`;
    }
    
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error querying LLM:', error);
    throw error;
  }
};

// Retrieval API function
export const retrieveContent = async (query: string): Promise<any> => {
  try {
    const response = await api.get('/retrieve/', { params: { query } });
    return response.data;
  } catch (error) {
    console.error('Error retrieving content:', error);
    throw error;
  }
};

// Sourcebook API functions
export const getSourcebooks = async (): Promise<Sourcebook[]> => {
  try {
    const response = await api.get('/sourcebooks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching sourcebooks:', error);
    throw error;
  }
};

export const uploadSourcebook = async (file: File): Promise<Sourcebook> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/sourcebooks/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading sourcebook:', error);
    throw error;
  }
};

export const deleteSourcebook = async (filename: string): Promise<void> => {
  try {
    await api.delete(`/sourcebooks/${encodeURIComponent(filename)}`);
  } catch (error) {
    console.error(`Error deleting sourcebook ${filename}:`, error);
    throw error;
  }
};

export const searchSourcebooks = async (query: string): Promise<any> => {
  try {
    const response = await api.get('/retrieve/', { params: { query } });
    return response.data;
  } catch (error) {
    console.error('Error searching sourcebooks:', error);
    throw error;
  }
};