// Authentication store using Zustand
import { create } from 'zustand';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  loading: true,
  error: null,

  // Actions
  setUser: (user) => set({ user, loading: false, error: null }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  logout: () => set({ user: null, loading: false, error: null }),
  
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));

// Selectors (for optimized component subscriptions)
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => !!state.user;
export const selectAuthLoading = (state: AuthStore) => state.loading;
export const selectAuthError = (state: AuthStore) => state.error;

