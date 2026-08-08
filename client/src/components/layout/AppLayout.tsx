import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/challans': 'Sales Challans',
  '/follow-ups': 'Follow-ups',
  '/users': 'User Management',
  '/settings': 'Settings',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const pageTitle = Object.entries(routeTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? '';

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} pageTitle={pageTitle} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
