import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#FFFFFF',
                color: '#252525',
                border: '1px solid #EEEEEE',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                fontSize: '14px',
                fontWeight: 500,
              },
              success: {
                iconTheme: {
                  primary: '#22C55E',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
