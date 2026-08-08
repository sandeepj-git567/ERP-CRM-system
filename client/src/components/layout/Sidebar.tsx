import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Warehouse, FileText,
  CalendarCheck, LogOut, ChevronRight, Shield,
  TrendingUp, X, FileSpreadsheet, Settings
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useCompany } from '../../lib/company-context';
import { Role } from '../../types';

interface NavItemConfig {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: Role[];
}

const navItems: NavItemConfig[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers CRM', roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { to: '/products', icon: Package, label: 'Products', roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/inventory', icon: Warehouse, label: 'Inventory', roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/challans', icon: FileText, label: 'Sales Challans', roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] },
  { to: '/follow-ups', icon: CalendarCheck, label: 'Follow-ups', roles: ['ADMIN', 'SALES'] },
  { to: '/reports', icon: FileSpreadsheet, label: 'Reports & GST', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { to: '/settings', icon: Settings, label: 'Company Settings', roles: ['ADMIN', 'ACCOUNTS'] },
  { to: '/users', icon: Shield, label: 'User Accounts', roles: ['ADMIN'] },
];

const roleColors: Record<Role, string> = {
  ADMIN: 'badge-purple',
  SALES: 'badge-blue',
  WAREHOUSE: 'badge-yellow',
  ACCOUNTS: 'badge-green',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-64 bg-[#1e293b] border-r border-slate-700/60
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 leading-tight truncate">{company.tradeName || 'Apex ERP'}</p>
              <p className="text-xs text-slate-500 truncate">{company.city || 'Operations Portal'}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </p>
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item-default'
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-700/60">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700/60"
            title="Edit My Profile & Bio"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <span className={`text-xs ${roleColors[user?.role as Role] ?? 'badge-gray'}`}>
                {user?.role}
              </span>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full nav-item-default mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
