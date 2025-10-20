// Google Authentication hook using expo-auth-session
// import removed: makeRedirectUri not needed when using Expo proxy defaults
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { signInWithGoogleIdToken } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

// Enable web browser for auth session
WebBrowser.maybeCompleteAuthSession();

/**
 * Hook for Google Sign-In using expo-auth-session
 * 
 * @returns Object with signInWithGoogle function and loading state
 * 
 * @example
 * ```tsx
 * const { signInWithGoogle, isLoading } = useGoogleAuth();
 * 
 * const handleGoogleSignIn = async () => {
 *   try {
 *     await signInWithGoogle();
 *   } catch (error) {
 *     console.error('Google sign-in failed:', error);
 *   }
 * };
 * ```
 */
export function useGoogleAuth() {
  const { setUser, setError, setLoading } = useAuthStore();

  // No manual redirectUri; Expo will use the Auth Proxy in Expo Go

  // Configure Google OAuth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    // iOS Client ID
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 
      '222266867045-jvm744l8tcdh0075l3su9f42gm76jbpr.apps.googleusercontent.com',
    
    // Android Client ID
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 
      '222266867045-mt0nmnm42cvgpcesbik6h1pge2jd3idb.apps.googleusercontent.com',
    
    // Web Client ID (used for Firebase)
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
      '222266867045-mt0nmnm42cvgpcesbik6h1pge2jd3idb.apps.googleusercontent.com',
    
    // Request proper scopes
    scopes: ['openid', 'profile', 'email'],
    
    // No redirectUri override
  });

  // Handle authentication response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      
      if (id_token) {
        setLoading(true);
        signInWithGoogleIdToken(id_token)
          .then((user) => {
            setUser(user);
            setError(null);
          })
          .catch((error) => {
            console.error('Google sign-in error:', error);
            setError(error.message || 'Failed to sign in with Google');
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setError('No ID token received from Google');
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      setError('Google sign-in was cancelled or failed');
    }
  }, [response, setUser, setError, setLoading]);

  return {
    /**
     * Initiate Google Sign-In flow
     */
    signInWithGoogle: async () => {
      try {
        return await promptAsync();
      } catch (error) {
        console.error('Error prompting Google sign-in:', error);
        throw new Error('Failed to initiate Google sign-in');
      }
    },
    /**
     * Whether the Google auth request is still being prepared
     */
    isLoading: !request,
  };
}

