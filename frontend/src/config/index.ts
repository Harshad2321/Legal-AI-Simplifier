// Configuration for API service - switches between real backend and demo mode
export const config = {
  // Enable demo mode when backend is not available (like on GitHub Pages)
  isDemoMode: process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_BASE_URL,
  
  // API Base URL - defaults to demo mode if not specified in production
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  
  // Demo mode settings
  demo: {
    simulateNetworkDelay: true,
    defaultDelay: 1000,
    uploadDelay: 2000,
    processingDelay: 3000
  }
};

// Helper to determine if we should use demo mode
export const shouldUseDemoMode = (): boolean => {
  // Use demo mode if:
  // 1. Explicitly enabled via config
  // 2. In production but no API URL provided (GitHub Pages scenario)
  // 3. API health check fails (could add this later)
  return config.isDemoMode || (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_BASE_URL);
};