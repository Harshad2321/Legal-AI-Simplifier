import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './components/theme-provider';
import UploadPage from './pages/UploadPage';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="legal-ai-theme">
      <div className="App min-h-screen bg-background text-foreground transition-colors">
        <UploadPage />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              duration: 3000,
              style: {
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: 'hsl(var(--destructive))',
                color: 'hsl(var(--destructive-foreground))',
              },
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;