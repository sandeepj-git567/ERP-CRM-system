import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth-context';
import { RealtimeProvider } from './lib/realtime-context';
import { CompanyProvider } from './lib/company-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallansListPage } from './pages/ChallansListPage';
import { CreateChallanPage } from './pages/CreateChallanPage';
import { ChallanDetailPage } from './pages/ChallanDetailPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <RealtimeProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Customers & CRM */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  </Route>
                  <Route element={<ProtectedRoute roles={['ADMIN', 'SALES']} />}>
                    <Route path="/follow-ups" element={<FollowUpsPage />} />
                  </Route>

                  {/* Products & Inventory */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'WAREHOUSE', 'SALES']} />}>
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                  </Route>
                  <Route element={<ProtectedRoute roles={['ADMIN', 'WAREHOUSE']} />}>
                    <Route path="/inventory" element={<InventoryPage />} />
                  </Route>

                  {/* Sales Challans */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']} />}>
                    <Route path="/challans" element={<ChallansListPage />} />
                    <Route path="/challans/:id" element={<ChallanDetailPage />} />
                  </Route>
                  <Route element={<ProtectedRoute roles={['ADMIN', 'SALES']} />}>
                    <Route path="/challans/new" element={<CreateChallanPage />} />
                  </Route>

                  {/* Reports & GST Exports */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']} />}>
                    <Route path="/reports" element={<ReportsPage />} />
                  </Route>

                  {/* Company Settings */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'ACCOUNTS']} />}>
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Admin only */}
                  <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                    <Route path="/users" element={<UsersPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </RealtimeProvider>
        </CompanyProvider>
      </AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
          },
        }}
      />
    </BrowserRouter>
  );
}
