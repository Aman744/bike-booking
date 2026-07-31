import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { loginSchema, LoginInput } from 'shared';
import useAuth from '../../hooks/useAuth';
import useSettings from '../../hooks/useSettings';
import { toast } from 'sonner';

export const AdminLoginPage = () => {
  const { login, isLoggingIn, isAuthenticated, forgotPasswordReset, isResettingPassword } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isForgotMode, setIsForgotMode] = useState(false);
  const isImageUrl = (val?: string) => val && (val.startsWith('http') || val.startsWith('data:image/'));

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Login Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onLoginSubmit = (data: LoginInput) => {
    login(data);
  };

  // Forgot Password Form Handler
  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('reset-email') as string;
    const newPass = formData.get('reset-password') as string;
    const confirmPass = formData.get('reset-confirm') as string;

    if (!email || !newPass || !confirmPass) {
      toast.error('All fields are required');
      return;
    }

    if (newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPass !== confirmPass) {
      toast.error('Passwords do not match');
      return;
    }

    forgotPasswordReset(
      { email, newPass },
      {
        onSuccess: () => {
          setIsForgotMode(false);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      {/* Logo Header */}
      <div className="flex flex-col items-center mb-8">
        <img 
          src={isImageUrl(settings?.dealershipLogo) ? settings?.dealershipLogo : 'https://lykanrides.com/wp-content/uploads/2025/03/logo.png'} 
          alt="Dealership Logo" 
          className="h-12 w-auto object-contain mb-4" 
        />
        <h1 className="font-display text-3xl font-extrabold text-gradient text-center">
          {isForgotMode ? 'Reset Security' : 'Unlock Admin Console'}
        </h1>
        {isForgotMode && (
          <p className="text-slate-400 text-xs mt-1 font-sans text-center">
            Simulated console password overwrite
          </p>
        )}
      </div>

      <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        {!isForgotMode ? (
          /* ========================================================
             1. Login Form Panel
             ======================================================== */
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-6">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Work Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@dealership.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  disabled={isLoggingIn}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium pl-1 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Access Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotMode(true)}
                  className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  disabled={isLoggingIn}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium pl-1 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-800 bg-slate-900/60 text-blue-500 focus:ring-0 w-4 h-4"
                  disabled={isLoggingIn}
                  {...register('rememberMe')}
                />
                <span className="text-xs text-slate-400 font-medium">Remember my session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-600/50 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 focus:outline-none transition-all flex items-center justify-center gap-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        ) : (
          /* ========================================================
             2. Forgot / Overwrite Password Form Panel
             ======================================================== */
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Account Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="reset-email"
                  required
                  placeholder="name@dealership.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  disabled={isResettingPassword}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Define New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="reset-password"
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  disabled={isResettingPassword}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="reset-confirm"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  disabled={isResettingPassword}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotMode(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 border border-white/5 text-slate-300 text-sm py-3 rounded-xl focus:outline-none transition-all"
                disabled={isResettingPassword}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-600/50 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 focus:outline-none transition-all flex items-center justify-center gap-2"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Link Footer */}
        <div className="text-center mt-6 pt-5 border-t border-white/5">
          <p className="text-xs text-slate-500">
            Need a console access account?{' '}
            <Link to="/admin/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Sign Up Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
