export const config = {
  isDemoMode: false,
  apiBaseUrl: 'https://legal-ai-backend-58fv.onrender.com',
  demo: {
    simulateNetworkDelay: true,
    defaultDelay: 1000,
    uploadDelay: 2000,
    processingDelay: 3000
  }
};

export const shouldUseDemoMode = (): boolean => {
  return false;
};