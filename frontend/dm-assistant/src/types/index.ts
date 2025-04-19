export interface Campaign {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface NarrationLog {
  id: number;
  campaign_id: number;
  content: string;
  created_at: string;
}

export interface Session {
  id: number;
  campaign_id: number;
  start_time: string;
  end_time?: string;
}

export interface LLMQueryRequest {
  prompt: string;
}

export interface LLMQueryResponse {
  response: string;
  context_note?: string;
  error?: string;
  fallback_response?: string;
}

export interface Sourcebook {
  filename: string;
  size: number;
  created_at: string;
  processed: boolean;
}

export interface SearchResult {
  query: string;
  results: {
    documents: string[];
    metadatas: { filename: string }[];
    distances: number[];
  };
}