import { create } from 'zustand';
import { IAdmin } from 'shared';

interface AuthState {
  admin: IAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAdmin: (admin: IAdmin | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  setAdmin: (admin) => set({ admin, isAuthenticated: !!admin }),
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ admin: null, isAuthenticated: false }),
}));

export default useAuthStore;
