import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bike, FileSpreadsheet, Settings, LogOut, Menu, X, User, BarChart3 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useSettings from '../hooks/useSettings';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { admin, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Bikes Inventory', href: '/admin/bikes', icon: Bike },
    { name: 'Bookings Logs', href: '/admin/bookings', icon: FileSpreadsheet },
    { name: 'Reports & Invoices', href: '/admin/reports', icon: BarChart3 },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  const isImageUrl = (val?: string) => val && (val.startsWith('http') || val.startsWith('data:image/'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900/80 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isImageUrl(settings?.dealershipLogo) ? (
            <img src={settings?.dealershipLogo} alt="Logo" className="h-6 w-auto object-contain max-w-[120px]" />
          ) : (
            <>
              <Bike className="w-6 h-6 text-blue-500" />
              <span className="font-display font-black text-lg tracking-wider text-gradient-blue uppercase">
                {settings?.dealershipLogo || settings?.dealershipName || 'MOTOHUB'}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 text-slate-400 hover:text-slate-200"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/60 border-r border-white/5 flex flex-col justify-between p-6 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 md:static ${
          isMobileOpen ? 'translate-x-0 pt-20 md:pt-6' : '-translate-x-0 -translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="hidden md:flex items-center gap-3 px-0">
            {isImageUrl(settings?.dealershipLogo) ? (
              <img src={settings?.dealershipLogo} alt="Logo" className="h-8 w-auto object-contain max-w-[160px]" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-md">
                  <Bike className="w-5 h-5" />
                </div>
                <span className="font-display font-black text-xl tracking-wider text-gradient-blue uppercase">
                  {settings?.dealershipLogo || settings?.dealershipName || 'MOTOHUB'}
                </span>
              </>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg active-nav-shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Badge Box */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex items-center gap-3 px-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 border border-white/5">
              <User className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{admin?.name || 'Admin User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{admin?.email || 'admin@dealership.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 font-medium text-xs py-3 px-4 rounded-xl border border-red-500/20 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Work Session</span>
          </button>
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
