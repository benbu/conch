// Authentication store using Zustand
import { create } from 'zustand';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  // Presence state
  customStatus: string | undefined;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setCustomStatus: (status: string | undefined) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  loading: true,
  error: null,
  customStatus: undefined,

  // Actions
  setUser: (user) => set({ user, loading: false, error: null }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  logout: () => set({ user: null, loading: false, error: null, customStatus: undefined }),
  
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setCustomStatus: (status) => set({ customStatus: status }),
}));

// Selectors (for optimized component subscriptions)
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => !!state.user;
export const selectAuthLoading = (state: AuthStore) => state.loading;
export const selectAuthError = (state: AuthStore) => state.error;
export const selectCustomStatus = (state: AuthStore) => state.customStatus;

