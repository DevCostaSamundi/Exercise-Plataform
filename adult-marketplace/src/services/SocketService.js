/**
 * SocketService — Singleton global verdadeiro.
 * Sobrevive ao double-mount do React StrictMode.
 * Um único socket para toda a app.
 */

import { io } from 'socket.io-client';
import { getAuthToken } from './api';

// Guardado fora do módulo React — não é afetado por re-renders ou unmounts
let socket = null;
let connectCalled = false;

export function connectSocket(token) {
  // Se já existe e está ligado — devolver imediatamente
  if (socket?.connected) return socket;

  // Se existe mas está a ligar — devolver o mesmo
  if (socket && !socket.disconnected) return socket;

  // Se existe mas foi desligado explicitamente (logout) — limpar
  if (socket) {
    socket.removeAllListeners();
    socket = null;
  }

  const authToken = token || getAuthToken();
  if (!authToken) {
    if (import.meta.env.DEV) console.warn('[Socket] Sem token — ligação cancelada');
    return null;
  }

  const url =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

  if (import.meta.env.DEV) console.log('[Socket] A criar ligação para', url);

  socket = io(url, {
    transports: ['websocket', 'polling'],
    auth: { token: authToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    closeOnBeforeunload: false,
  });

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('✅ [Socket] Ligado:', socket.id);
  });

  socket.on('connect_error', (err) => {
    if (import.meta.env.DEV) console.error('❌ [Socket] Erro:', err.message);
  });

  socket.on('disconnect', (reason) => {
    if (import.meta.env.DEV) console.log('⚠️ [Socket] Desligado:', reason);
    // Reconectar automaticamente só se o servidor fechou (não se foi o cliente)
    if (reason === 'io server disconnect') {
      setTimeout(() => socket?.connect(), 1000);
    }
  });

  return socket;
}

/**
 * Chamar APENAS no logout — nunca em cleanup de componentes
 */
export function disconnectSocket() {
  if (socket) {
    if (import.meta.env.DEV) console.log('[Socket] Logout — a fechar ligação');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

export function emitEvent(event, payload) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error('Socket não ligado'));
    socket.timeout(5000).emit(event, payload, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}