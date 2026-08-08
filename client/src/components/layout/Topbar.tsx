import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useRealtime } from '../../lib/realtime-context';
import { RealtimeActivityDrawer } from '../common/RealtimeActivityDrawer';

interface TopbarProps {
  onMenuOpen: () => void;
  pageTitle?: string;
}

export function Topbar({ onMenuOpen, pageTitle }: TopbarProps) {
  const { user } = useAuth();
  const { isConnected, onlineCount, unreadCount } = useRealtime();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-[#1e293b]/80 backdrop-blur-sm border-b border-slate-700/60 flex items-center px-4 gap-4 sticky top-0 z-10">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden btn-ghost p-2 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div className="flex-1 flex items-center gap-3">
          {pageTitle && (
            <h1 className="text-base font-semibold text-slate-200">{pageTitle}</h1>
          )}

          {/* Live Sync Status Pill */}
          <div
            onClick={() => setDrawerOpen(true)}
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all text-xs text-slate-300"
            title={`Real-Time Sync active. ${onlineCount} role(s) online.`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-[11px] font-medium text-slate-300">
              {isConnected ? 'Real-Time Sync' : 'Reconnecting...'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({onlineCount} live)
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Live Activity Drawer Toggle */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost p-2 rounded-lg relative hover:bg-slate-800 text-slate-300 transition-colors"
            aria-label="Real-time notifications & activity"
            title="Open Live Activity Feed"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 border-l border-slate-700 hover:opacity-85 transition-opacity"
            title="View & Edit My Profile / Bio"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
              <span className="text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-200 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 font-semibold tracking-wide">{user?.role}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Real-time Activity Drawer */}
      <RealtimeActivityDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
