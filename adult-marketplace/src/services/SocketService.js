import { io } from 'socket.io-client';
import { getAuthToken } from './api';

let socket = null;

/**
 * Connect to socket server with authentication
 * @param {string} token - Optional authentication token. If not provided, uses getAuthToken()
 * @returns {Socket} Socket.io client instance
 */
export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  
  // Use provided token or get from storage
  const authToken = token || getAuthToken();
  
  // Get socket URL from environment variables with fallback
  const url = import.meta.env.VITE_SOCKET_URL || 
              import.meta.env.VITE_API_URL || 
              window.location.origin;
  
  socket = io(url, {
    transports: ['websocket'],
    auth: {
      token: authToken,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connect_error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚠️ Socket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// utility to emit with promise ack
export function emitEvent(event, payload) {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not connected'));
    socket.timeout(5000).volatile.emit(event, payload, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

export function getSocket() {
  return socket;
}