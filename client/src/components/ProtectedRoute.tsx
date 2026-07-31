import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 text-sm animate-pulse-soft">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while capturing target path
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && admin) {
    const hasPermission = admin.permissions.includes(requiredPermission);
    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
          <div className="glass-panel p-8 rounded-2xl border border-red-500/15 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-2 font-display">Access Denied</h2>
            <p className="text-slate-400 text-sm mb-6">
              You do not have the required permissions ({requiredPermission}) to access this page.
            </p>
            <Navigate to="/admin/dashboard" replace />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
