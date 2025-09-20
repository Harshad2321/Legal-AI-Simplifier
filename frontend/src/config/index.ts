// Configuration for API service - switches between real backend and demo mode
export const config = {
  // Enable demo mode only when explicitly no API URL is provided
  isDemoMode: false, // Always try real API first
  
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
  // Only use demo mode if API URL is explicitly not set or empty
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const shouldUseDemo = !apiUrl || apiUrl.trim() === '';
  
  console.log('🔧 Demo Mode Check:', {
    apiUrl,
    nodeEnv: process.env.NODE_ENV,
    shouldUseDemo
  });
  
  return shouldUseDemo;
};