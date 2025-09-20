import React from 'react';
import { Toaster } from 'react-hot-toast';
import UploadPage from './pages/UploadPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <UploadPage />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;