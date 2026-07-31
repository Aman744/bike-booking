import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { useAuthStore } from '../features/auth/authStore';
import { LoginInput, RegisterInput } from 'shared';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAdmin, logout: storeLogout, setLoading } = useAuthStore();

  // Query to fetch session info on startup
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.data?.admin) {
          setAdmin(res.data.admin);
          return res.data.admin;
        }
        setAdmin(null);
        return null;
      } catch (err) {
        setAdmin(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => authService.login(credentials),
    onSuccess: (res) => {
      if (res.success && res.data?.admin) {
        setAdmin(res.data.admin);
        toast.success(res.message || 'Authenticated successfully');
        navigate('/admin/dashboard');
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      storeLogout();
      queryClient.setQueryData(['me'], null);
      toast.success('Logged out successfully');
      navigate('/admin/login');
    },
    onError: () => {
      toast.error('Logout failed');
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterInput) => authService.register(credentials),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Account created successfully! Please log in.');
        navigate('/admin/login');
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    },
  });

  // Forgot Password Reset Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: { email: string; newPass: string }) =>
      authService.forgotPasswordReset(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Password reset successfully! Please log in.');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Password reset failed. Please try again.';
      toast.error(msg);
    },
  });

  return {
    admin: useAuthStore((state) => state.admin),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated),
    isLoading: useAuthStore((state) => state.isLoading),
    isCheckingSession: meQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    forgotPasswordReset: forgotPasswordMutation.mutate,
    isResettingPassword: forgotPasswordMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};

export default useAuth;
