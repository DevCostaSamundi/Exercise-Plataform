/**
 * SocketService — Singleton verdadeiro via window.__socket__
 * Sobrevive a HMR do Vite, double-mount do StrictMode,
 * e múltiplas importações do mesmo módulo.
 *
 * REGRA: connectSocket() é idempotente — devolve sempre o mesmo socket.
 *        disconnectSocket() só deve ser chamado no LOGOUT.
 */

import { io } from 'socket.io-client';
import { getAuthToken } from './api';

// Guardar no window para sobreviver a HMR e múltiplas instâncias do módulo
const SOCKET_KEY = '__app_socket__';

function getStoredSocket() {
  return window[SOCKET_KEY] || null;
}

function storeSocket(s) {
  window[SOCKET_KEY] = s;
}

function clearStoredSocket() {
  window[SOCKET_KEY] = null;
}

/**
 * Retorna o socket existente se ligado, ou cria um novo.
 * Seguro chamar de qualquer lugar — nunca cria duplicados.
 */
export function connectSocket(token) {
  const existing = getStoredSocket();

  // Já existe e está ligado ou a ligar — devolver
  if (existing && (existing.connected || existing.active)) {
    return existing;
  }

  // Existe mas está desligado — destruir antes de criar novo
  if (existing) {
    existing.removeAllListeners();
    existing.disconnect();
    clearStoredSocket();
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

  if (import.meta.env.DEV) console.log('[Socket] A criar singleton para', url);

  const s = io(url, {
    transports: ['websocket', 'polling'],
    auth: { token: authToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,
    closeOnBeforeunload: false,
    // Timeout mais alto para evitar desconexões por ping lento
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  s.on('connect', () => {
    if (import.meta.env.DEV) console.log('✅ [Socket] Ligado:', s.id);
  });

  s.on('connect_error', (err) => {
    if (import.meta.env.DEV) console.error('❌ [Socket] Erro:', err.message);
  });

  s.on('disconnect', (reason) => {
    if (import.meta.env.DEV) console.log('⚠️ [Socket] Desligado:', reason);
    // Só reconectar se foi o servidor a fechar — não se foi o cliente
    if (reason === 'io server disconnect') {
      setTimeout(() => getStoredSocket()?.connect(), 1000);
    }
  });

  storeSocket(s);
  return s;
}

/**
 * Chamar APENAS no logout.
 * Nunca chamar em cleanup de useEffect ou unmount de componentes.
 */
export function disconnectSocket() {
  const s = getStoredSocket();
  if (s) {
    if (import.meta.env.DEV) console.log('[Socket] Logout — a fechar ligação');
    s.removeAllListeners();
    s.disconnect();
    clearStoredSocket();
  }
}

export function getSocket() {
  return getStoredSocket();
}

export function emitEvent(event, payload) {
  return new Promise((resolve, reject) => {
    const s = getStoredSocket();
    if (!s?.connected) return reject(new Error('Socket não ligado'));
    s.timeout(5000).emit(event, payload, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}