// API base URL - use environment variable for cloud deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API client functions
export const api = {
  // Authentication
  signup: async (data: { email: string; password: string; name?: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // File upload and analysis
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Quote history and analytics
  getQuoteHistory: async (limit: number = 20) => {
    const response = await fetch(`${API_BASE_URL}/quotes?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getQuoteById: async (quoteId: string) => {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Health and status
  getHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  getAIStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/ai-status`);
    return response.json();
  },
};

export default api; 