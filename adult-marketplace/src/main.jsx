import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3AuthProvider } from './hooks/useWeb3Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import App from './App';
import './index.css';

// NÃO chamar connectSocket() aqui — o SocketProvider trata disso.
// Chamar aqui causa múltiplas instâncias em HMR do Vite.

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

// StrictMode removido — causa double-mount que conflitua com sockets
ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <Web3AuthProvider>
      <AuthProvider>
        <AppWithSocket />
      </AuthProvider>
    </Web3AuthProvider>
  </QueryClientProvider>
);