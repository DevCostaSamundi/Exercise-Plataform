import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3AuthProvider } from './hooks/useWeb3Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import App from './App';
import './index.css';

// Pré-criar o socket antes do React montar
// Isto garante que o singleton existe antes do double-mount do StrictMode
import { connectSocket } from './services/SocketService';
import { getAuthToken } from './services/api';
const existingToken = getAuthToken();
if (existingToken) connectSocket(existingToken);

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

// ⚠️ StrictMode removido em dev para evitar double-connect no socket.
// Para re-activar em produção (onde StrictMode não faz double-mount),
// podes envolver apenas <App /> com StrictMode se necessário.
ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <Web3AuthProvider>
      <AuthProvider>
        <AppWithSocket />
      </AuthProvider>
    </Web3AuthProvider>
  </QueryClientProvider>
);