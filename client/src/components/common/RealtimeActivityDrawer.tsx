import { useState } from 'react';
import { useRealtime, RealtimeEventPayload } from '../../lib/realtime-context';
import {
  Activity,
  X,
  CheckCircle2,
  Trash2,
  Users,
  Package,
  FileText,
  Clock,
  Radio,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface RealtimeActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RealtimeActivityDrawer({ isOpen, onClose }: RealtimeActivityDrawerProps) {
  const { isConnected, onlineCount, roleCounts, recentEvents, clearEvents, markAllAsRead } =
    useRealtime();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS' | 'ADMIN'>('ALL');

  if (!isOpen) return null;

  const filteredEvents = recentEvents.filter((e) => {
    if (selectedFilter === 'ALL') return true;
    return e.meta.actorRole === selectedFilter;
  });

  const getEntityIcon = (entity: RealtimeEventPayload['entity']) => {
    switch (entity) {
      case 'customer':
      case 'followUp':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'product':
      case 'stock':
        return <Package className="w-4 h-4 text-amber-400" />;
      case 'challan':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-purple-400" />;
    }
  };

  const getEntityLink = (event: RealtimeEventPayload) => {
    switch (event.entity) {
      case 'customer':
        return event.data?.id ? `/customers/${event.data.id}` : '/customers';
      case 'product':
        return event.data?.id ? `/products/${event.data.id}` : '/products';
      case 'stock':
        return '/inventory';
      case 'challan':
        return event.data?.id ? `/challans/${event.data.id}` : '/challans';
      case 'followUp':
        return '/follow-ups';
      case 'user':
        return '/users';
      default:
        return '/dashboard';
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'SALES':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'WAREHOUSE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'ACCOUNTS':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#1e293b] border-l border-slate-700 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-700/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Radio className={`w-5 h-5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100">Live Activity Stream</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                      }`}
                    />
                    {isConnected ? 'Real-Time Sync Active' : 'Connecting...'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant live events across Sales, Warehouse, Accounts & Admin
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Roles Online Grid */}
          <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Live Connected Roles
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                {onlineCount} Online
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedFilter(selectedFilter === role ? 'ALL' : role)}
                  className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                    selectedFilter === role
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <p className="text-[10px] font-bold tracking-wider">{role}</p>
                  <p className="text-xs font-semibold text-slate-200">
                    {roleCounts[role] || 0} active
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills & Actions */}
          <div className="px-5 py-2.5 bg-slate-900/30 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'SALES', 'WAREHOUSE', 'ACCOUNTS', 'ADMIN'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
                    selectedFilter === filter
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllAsRead}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 text-xs flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              {recentEvents.length > 0 && (
                <button
                  onClick={clearEvents}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 text-xs"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Event Stream List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
                <div className="p-3 bg-slate-800 rounded-full text-slate-500 mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No events yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Real-time events will appear here instantly when any user creates a Challan, restocks products, or registers a customer.
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all duration-200 hover:border-slate-600 hover:shadow-lg flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-700">
                        {getEntityIcon(event.entity)}
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleBadge(
                            event.meta.actorRole
                          )}`}
                        >
                          {event.meta.actorRole || event.entity}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 mt-1">
                          {event.meta.title}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(event.meta.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 pl-1">{event.meta.description}</p>

                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      by <strong className="text-slate-300">{event.meta.actorName || 'System'}</strong>
                    </span>
                    <Link
                      to={getEntityLink(event)}
                      onClick={onClose}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer banner */}
          <div className="p-3.5 border-t border-slate-700 bg-slate-900/70 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Auto-sync enabled with TanStack React Query
            </span>
            <span className="text-[11px] text-slate-500">Sub-second latency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
