import { io } from 'socket.io-client';
import api from './api'; // para saber baseURL se precisar

let socket = null;

export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  const url = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  socket = io(url, {
    transports: ['websocket'],
    auth: {
      token, // server side must validate token on connection
    },
    autoConnect: true,
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error', err);
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