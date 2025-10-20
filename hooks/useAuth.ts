// Custom authentication hook
import { useCallback } from 'react';
import {
  sendPasswordReset,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  updateUserProfile,
} from '../services/authService';
import { selectAuthLoading, selectIsAuthenticated, selectUser, useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const loading = useAuthStore(selectAuthLoading);
  const { setUser, logout, setError, setLoading, updateUser } = useAuthStore();

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        setLoading(true);
        setError(null);
        const user = await signUpWithEmail(email, password, displayName);
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setError, setLoading]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);
        const user = await signInWithEmail(email, password);
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setError, setLoading]
  );

  const signInGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const errorMessage = 'Google Sign-In is not yet configured for React Native. Please use email/password authentication or configure expo-auth-session.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await signOutUser();
      logout();
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logout, setError, setLoading]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setError(null);
        await sendPasswordReset(email);
      } catch (error: any) {
        setError(error.message);
        throw error;
      }
    },
    [setError]
  );

  const updateProfile = useCallback(
    async (updates: Parameters<typeof updateUserProfile>[1]) => {
      if (!user) {
        throw new Error('No user logged in');
      }

      try {
        setError(null);
        await updateUserProfile(user.id, updates);
        updateUser(updates);
      } catch (error: any) {
        setError(error.message);
        throw error;
      }
    },
    [user, updateUser, setError]
  );

  return {
    user,
    isAuthenticated,
    loading,
    signUp,
    signIn,
    signInGoogle,
    signOut,
    resetPassword,
    updateProfile,
  };
}

