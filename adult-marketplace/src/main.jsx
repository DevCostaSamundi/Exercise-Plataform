import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3AuthProvider } from './hooks/useWeb3Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import App from './App';
import './index.css';

// ✅ Wrapper para injectar user no SocketProvider e ChatProvider
// SocketContext.jsx espera { children, user } — sem user o socket nunca conecta
function AppWithSocket() {
  const { user } = useAuth();
  return (
    <SocketProvider user={user}>
      <ChatProvider>
        <App />
      </ChatProvider>
    </SocketProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Web3AuthProvider>
        <AuthProvider>
          <AppWithSocket />
        </AuthProvider>
      </Web3AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);