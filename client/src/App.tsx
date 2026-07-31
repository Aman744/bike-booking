import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Features Placeholder Pages
import CustomerBookingPage from './features/booking/CustomerBookingPage';
import BookingSuccessPage from './features/booking/BookingSuccessPage';
import AdminBookingsPage from './features/booking/AdminBookingsPage';
import AdminLoginPage from './features/auth/AdminLoginPage';
import AdminRegisterPage from './features/auth/AdminRegisterPage';
import AdminDashboardPage from './features/dashboard/AdminDashboardPage';
import BikeInventoryPage from './features/bike/BikeInventoryPage';
import AdminSettingsPage from './features/dashboard/AdminSettingsPage';
import AdminReportsPage from './features/dashboard/AdminReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

import { useEffect } from 'react';
import useSettings from './hooks/useSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ThemeInitializer = () => {
  const { settings } = useSettings();
  
  useEffect(() => {
    if (settings?.colorSystem) {
      document.documentElement.className = `theme-${settings.colorSystem}`;
    } else {
      document.documentElement.className = 'theme-blue';
    }
  }, [settings?.colorSystem]);

  useEffect(() => {
    if (settings?.dealershipFavicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.dealershipFavicon;
    }
  }, [settings?.dealershipFavicon]);

  return null;
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <BrowserRouter basename={import.meta.env.MODE === 'production' ? '/bike-booking' : '/'}>
        <Routes>
          {/* Customer Booking QR Entrypoints (Clean full-viewport container) */}
          <Route
            path="/book"
            element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
                <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-4xl w-full shadow-2xl animate-fade-in">
                  <CustomerBookingPage />
                </div>
              </div>
            }
          />
          <Route
            path="/book/:bikeId"
            element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
                <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-4xl w-full shadow-2xl animate-fade-in">
                  <CustomerBookingPage />
                </div>
              </div>
            }
          />
          <Route
            path="/booking/success/:bookingNumber"
            element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
                <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl">
                  <BookingSuccessPage />
                </div>
              </div>
            }
          />

          {/* Admin Login (Clean standalone view) */}
          <Route
            path="/admin/login"
            element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
                <AdminLoginPage />
              </div>
            }
          />
          <Route
            path="/admin/register"
            element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
                <AdminRegisterPage />
              </div>
            }
          />

          {/* Admin Control Panel Routes (Wrapped in Protected Guard and Sidebar Layout) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bikes"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BikeInventoryPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminBookingsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminReportsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
        <Toaster theme="dark" position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
