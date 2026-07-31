import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { registerSchema, RegisterInput } from 'shared';
import useAuth from '../../hooks/useAuth';

export const AdminRegisterPage = () => {
  const { register: registerApi, isRegistering, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Admin',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerApi(data);
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-500 mb-3 shadow-lg shadow-blue-500/5">
          <KeyRound className="w-6 h-6 animate-pulse-soft" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-gradient">Create Account</h1>
        <p className="text-slate-400 text-xs mt-1 font-sans">
          Register a new administrative node console login
        </p>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Full Identity Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                disabled={isRegistering}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 font-medium pl-1 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

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
                disabled={isRegistering}
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
            <label className="text-xs font-semibold text-slate-300 block">
              Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                disabled={isRegistering}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium pl-1 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Role Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Administrative Authorization Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <select
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans appearance-none"
                disabled={isRegistering}
                {...register('role')}
              >
                <option value="Admin">Admin (Full write/read, no delete)</option>
                <option value="SuperAdmin">SuperAdmin (Full control + deletes)</option>
                <option value="Manager">Manager (Read & Edit entries)</option>
                <option value="Viewer">Viewer (Read-only access)</option>
              </select>
            </div>
            {errors.role && (
              <p className="text-xs text-red-500 font-medium pl-1 mt-1">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-600/50 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 focus:outline-none transition-all flex items-center justify-center gap-2 mt-4"
            disabled={isRegistering}
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-white/5">
          <p className="text-xs text-slate-500">
            Already have an active console account?{' '}
            <Link to="/admin/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Log In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
