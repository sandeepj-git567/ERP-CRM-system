import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('erp_token') || '';

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      autoConnect: !!token,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(token?: string): Socket {
  const currentToken = token || localStorage.getItem('erp_token') || '';
  const s = getSocket();

  s.auth = { token: currentToken };

  if (!s.connected) {
    s.connect();
  }

  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
