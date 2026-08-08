import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { connectSocket, disconnectSocket } from './socket';
import { useAuth } from './auth-context';

export interface RealtimeEventMeta {
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  title: string;
  description: string;
  timestamp: string;
}

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
  meta: RealtimeEventMeta;
  read?: boolean;
}

interface RealtimeContextValue {
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  onlineCount: number;
  roleCounts: Record<string, number>;
  recentEvents: RealtimeEventPayload[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearEvents: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected');
  const [onlineCount, setOnlineCount] = useState(1);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({
    ADMIN: 0,
    SALES: 0,
    WAREHOUSE: 0,
    ACCOUNTS: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RealtimeEventPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Invalidate queries based on event entity
  const handleQueryInvalidation = useCallback(
    (event: RealtimeEventPayload) => {
      switch (event.entity) {
        case 'customer':
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['customer'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          break;

        case 'followUp':
          queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
          queryClient.invalidateQueries({ queryKey: ['customer'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          break;

        case 'product':
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product'] });
          queryClient.invalidateQueries({ queryKey: ['product-categories'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          break;

        case 'stock':
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product'] });
          queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          break;

        case 'challan':
          queryClient.invalidateQueries({ queryKey: ['challans'] });
          queryClient.invalidateQueries({ queryKey: ['challan'] });
          queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changed on confirmation
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          break;

        case 'user':
          queryClient.invalidateQueries({ queryKey: ['users'] });
          break;

        default:
          queryClient.invalidateQueries();
          break;
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setIsConnected(false);
      setConnectionState('disconnected');
      return;
    }

    const token = localStorage.getItem('erp_token') || '';
    const socket = connectSocket(token);

    setConnectionState('connecting');

    const onConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const onConnectError = () => {
      setIsConnected(false);
      setConnectionState('reconnecting');
    };

    const onPresence = (data: { totalOnline: number; roleCounts: Record<string, number> }) => {
      setOnlineCount(data.totalOnline || 1);
      if (data.roleCounts) {
        setRoleCounts(data.roleCounts);
      }
    };

    const onRealtimeEvent = (event: RealtimeEventPayload) => {
      // 1. Immediately invalidate queries to sync all views in real time!
      handleQueryInvalidation(event);

      // 2. Add event to history
      setRecentEvents((prev) => [
        { ...event, read: false },
        ...prev.slice(0, 49), // Keep latest 50
      ]);
      setUnreadCount((prev) => prev + 1);

      // 3. Show a sleek real-time notification toast if initiated by another role/user
      const isSelf = event.meta?.actorId && user?.id === event.meta.actorId;
      if (!isSelf) {
        const roleColors: Record<string, string> = {
          ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          SALES: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          WAREHOUSE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          ACCOUNTS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };

        const roleBadgeClass = event.meta.actorRole
          ? roleColors[event.meta.actorRole] || 'bg-slate-700 text-slate-300'
          : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-black/20 p-4 transition-all duration-300 hover:border-blue-500/50`}
            >
              <div className="flex-1 w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${roleBadgeClass}`}
                  >
                    {event.meta.actorRole || event.entity}
                  </span>
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {event.meta.title}
                  </p>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {event.meta.description}
                </p>
              </div>
              <div className="ml-3 flex items-center">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ),
          { duration: 4500, position: 'bottom-right' }
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('erp:presence', onPresence);
    socket.on('erp:event', onRealtimeEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('erp:presence', onPresence);
      socket.off('erp:event', onRealtimeEvent);
    };
  }, [user, handleQueryInvalidation]);

  const markAllAsRead = useCallback(() => {
    setRecentEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    setUnreadCount(0);
  }, []);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
    setUnreadCount(0);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connectionState,
        onlineCount,
        roleCounts,
        recentEvents,
        unreadCount,
        markAllAsRead,
        clearEvents,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
