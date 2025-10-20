// Authentication context provider
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { initializeFirebase } from '../lib/firebase';
import { onAuthStateChange } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ initialized: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = React.useState(false);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize Firebase
    try {
      initializeFirebase();
      console.log('✅ Firebase initialized in AuthProvider');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
    }

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      
      if (!initialized) {
        setInitialized(true);
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

