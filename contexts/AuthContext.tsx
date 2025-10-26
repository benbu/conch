// Authentication context provider
import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { initializeFirebase } from '../lib/firebase';
import { onAuthStateChange, signInWithEmail } from '../services/authService';
import { getCreds } from '../services/credentialsStore';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  initialized: boolean;
  checkingCredentials: boolean;
}

const AuthContext = createContext<AuthContextType>({ initialized: false, checkingCredentials: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = React.useState(false);
  const [checkingCredentials, setCheckingCredentials] = React.useState(false);
  const { setUser, setLoading } = useAuthStore();
  const attemptedSilentRef = React.useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize Firebase
    try {
      initializeFirebase();
      console.log('✅ Firebase initialized in AuthProvider');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
    }

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setUser(user);
        setCheckingCredentials(false);
        if (!initialized) {
          setInitialized(true);
          setLoading(false);
        }
        return;
      }

      // No user from Firebase; attempt silent sign-in once using stored credentials
      if (!attemptedSilentRef.current) {
        attemptedSilentRef.current = true;
        try {
          setCheckingCredentials(true);
          const creds = await getCreds();
          console.log('Silent sign-in: creds loaded?', !!creds);
          if (creds && creds.email && creds.password) {
            console.log('Silent sign-in: attempting with stored creds');
            await signInWithEmail(creds.email, creds.password);
            // Ensure navigation to main tabs after silent sign-in succeeds
            setTimeout(() => {
              try { router.replace('/(tabs)'); } catch {}
            }, 0);
            return; // onAuthStateChanged will fire again
          }
        } catch (e) {
          console.warn('Silent sign-in attempt failed:', e);
        } finally {
          setCheckingCredentials(false);
        }
      }

      // Proceed to initialized state with no user
      if (!initialized) {
        setInitialized(true);
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ initialized, checkingCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

