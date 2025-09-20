// Configuration for API service - switches between real backend and demo mode
export const config = {
  // EMERGENCY FIX: Force real API mode
  isDemoMode: false,
  
  // API Base URL - HARDCODED for emergency
  apiBaseUrl: 'https://legal-ai-backend-58fv.onrender.com',
  
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
  // EMERGENCY FIX: Never use demo mode
  return false;
};