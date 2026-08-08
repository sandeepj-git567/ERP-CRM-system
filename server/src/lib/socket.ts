import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

export interface RealtimeEventPayload<T = any> {
  id: string;
  type:
    | 'CUSTOMER_CREATED'
    | 'CUSTOMER_UPDATED'
    | 'CUSTOMER_DELETED'
    | 'FOLLOW_UP_CREATED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'STOCK_UPDATED'
    | 'STOCK_MOVEMENT_CREATED'
    | 'CHALLAN_CREATED'
    | 'CHALLAN_UPDATED'
    | 'CHALLAN_CONFIRMED'
    | 'CHALLAN_CANCELLED'
    | 'USER_CREATED'
    | 'USER_UPDATED';
  entity: 'customer' | 'product' | 'challan' | 'stock' | 'user' | 'followUp';
  action: 'create' | 'update' | 'delete' | 'confirm' | 'cancel' | 'stock';
  data?: T;
  meta: {
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    title: string;
    description: string;
    timestamp: string;
  };
}

let io: SocketIOServer | null = null;
const connectedUsers = new Map<string, { socketId: string; user: JwtPayload }>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev/embedded environments
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ─── Authentication middleware ──────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');

    if (!token) {
      // Allow unauthenticated connection or reject: let's reject unauthenticated
      return next(new Error('Authentication required for real-time socket connection'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired socket token'));
    }
  });

  // ─── Socket connection handler ──────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JwtPayload;

    if (user) {
      connectedUsers.set(socket.id, { socketId: socket.id, user });

      // Join role room & user-specific room
      socket.join(`role:${user.role}`);
      socket.join(`user:${user.userId}`);
      socket.join('broadcast:erp');

      // Broadcast active user statistics
      broadcastPresence();
    }

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      broadcastPresence();
    });

    // Optional client ping for latency test
    socket.on('erp:ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ timestamp: new Date().toISOString() });
      }
    });
  });

  return io;
}

function broadcastPresence() {
  if (!io) return;

  const roleCounts: Record<string, number> = {
    ADMIN: 0,
    SALES: 0,
    WAREHOUSE: 0,
    ACCOUNTS: 0,
  };

  for (const { user } of connectedUsers.values()) {
    if (user.role && roleCounts[user.role] !== undefined) {
      roleCounts[user.role]++;
    }
  }

  io.emit('erp:presence', {
    totalOnline: connectedUsers.size,
    roleCounts,
    timestamp: new Date().toISOString(),
  });
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function emitRealtimeEvent<T = any>(
  event: Omit<RealtimeEventPayload<T>, 'id'> & { id?: string }
): void {
  if (!io) return;

  const payload: RealtimeEventPayload<T> = {
    id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: event.type,
    entity: event.entity,
    action: event.action,
    data: event.data,
    meta: {
      ...event.meta,
      timestamp: event.meta.timestamp || new Date().toISOString(),
    },
  };

  // Broadcast to all connected clients
  io.emit('erp:event', payload);
  io.emit(`erp:${event.entity}`, payload);
}
