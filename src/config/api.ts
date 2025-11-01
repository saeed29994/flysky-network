// 📁 src/config/api.ts

// API Configuration
export const API_CONFIG = {
  // Server URLs
  SERVER_URL: import.meta.env.VITE_SERVER_URL || 'https://flysky-server.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    SEND_NOTIFICATION: '/sendNotification',
    GET_NOTIFICATIONS: '/notifications',
    GET_USERS: '/users',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.SERVER_URL}${endpoint}`;
};

// Helper function to get full endpoint URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return buildApiUrl(API_CONFIG.ENDPOINTS[endpoint]);
}; 