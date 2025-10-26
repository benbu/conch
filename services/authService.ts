// Authentication service with Firebase
import { withNetworkLog } from '@/lib/networkLogger';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDB } from '../lib/firebase';
import { User } from '../types';
import { clearCreds, saveCreds } from './credentialsStore';
import { presenceClient } from './presenceClient';
 

const auth = getFirebaseAuth();
const db = getFirebaseDB();

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    // Create auth user
    const userCredential = await withNetworkLog('auth', 'createUserWithEmailAndPassword', 'auth', () =>
      createUserWithEmailAndPassword(auth, email, password)
    );
    const firebaseUser = userCredential.user;

    // Update profile
    await withNetworkLog('auth', 'updateProfile', 'auth', () => updateProfile(firebaseUser, { displayName }));

    // Create user document in Firestore
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      photoURL: firebaseUser.photoURL || null,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await withNetworkLog('firestore', 'setDoc', `/users/${user.id}`, () => setDoc(doc(db, 'users', user.id), user));
    try {
      console.log('Attempting to save credentials after sign-up for silent login fallback');
      await saveCreds(email, password);
    } catch (e) {
      console.warn('Failed to save credentials after sign-up:', e);
    }

    // Save credentials for silent sign-in fallback (Expo Go)
    try {
      await saveCreds(email, password);
    } catch (e) {
      console.warn('Failed to save credentials after sign-up:', e);
    }

    return user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await withNetworkLog('auth', 'signInWithEmailAndPassword', 'auth', () =>
      signInWithEmailAndPassword(auth, email, password)
    );
    const firebaseUser = userCredential.user;

    // Fetch user document from Firestore
    let user = await getUserById(firebaseUser.uid);
    
    // If user document doesn't exist, create it (recovery mechanism)
    if (!user) {
      console.log('User document not found, creating one...');
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await withNetworkLog('firestore', 'setDoc', `/users/${firebaseUser.uid}`, () => setDoc(doc(db, 'users', firebaseUser.uid), user as User));
    }

    // Ensure non-null user for downstream usage
    const ensuredUser: User = user!;

    // Initialize presence client and enqueue activity (throttled online/lastSeen)
    presenceClient.init(ensuredUser.id);
    presenceClient.enqueueActivity();

    // Save credentials for silent sign-in fallback (Expo Go)
    try {
      console.log('Attempting to save credentials (email/password) for silent login fallback');
      await saveCreds(email, password);
    } catch (e) {
      console.warn('Failed to save credentials for silent login fallback:', e);
    }

    return ensuredUser;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Sign in with Google using ID token
 * This is called after getting the ID token from expo-auth-session
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await withNetworkLog('auth', 'signInWithCredential', 'auth', () =>
      signInWithCredential(auth, credential)
    );
    const firebaseUser = userCredential.user;

    // Check if user document exists
    let user = await getUserById(firebaseUser.uid);

    if (!user) {
      // Create new user document
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Anonymous',
        photoURL: firebaseUser.photoURL || null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await withNetworkLog('firestore', 'setDoc', `/users/${firebaseUser.uid}`, () => setDoc(doc(db, 'users', firebaseUser.uid), user as User));
    }

    // Ensure non-null user for downstream usage
    const ensuredUser: User = user!;

    // Initialize presence client and enqueue activity (throttled online/lastSeen)
    presenceClient.init(ensuredUser.id);
    presenceClient.enqueueActivity();

    return ensuredUser;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Sign in with Google (legacy method - now throws error)
 * Use the hook useGoogleAuth() instead in your components
 */
export async function signInWithGoogle(): Promise<User> {
  throw new Error(
    'signInWithGoogle() is not supported in React Native. ' +
    'Please use the useGoogleAuth() hook in your component instead.'
  );
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  try {
    // Best-effort immediate offline update and dispose presence client
    await presenceClient.goOfflineNow();
    presenceClient.dispose();
    await withNetworkLog('auth', 'signOut', 'auth', () => signOut(auth));
    // Clear stored credentials
    try {
      await clearCreds();
    } catch (e) {
      console.warn('Failed to clear stored credentials:', e);
    }
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
  await withNetworkLog('auth', 'sendPasswordResetEmail', 'auth', () => sendPasswordResetEmail(auth, email));
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
}

/**
 * Get user by ID from Firestore
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await withNetworkLog('firestore', 'getDoc', `/users/${userId}`, () => getDoc(doc(db, 'users', userId)));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      timeZone: data.timeZone,
      defaultLanguage: data.defaultLanguage,
      autoTranslate: data.autoTranslate,
      preferredAIModel: data.preferredAIModel,
      workHours: data.workHours,
      appearOffline: data.appearOffline,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  try {
    await withNetworkLog('firestore', 'setDoc', `/users/${userId}`, () =>
      setDoc(
        doc(db, 'users', userId),
        {
          ...updates,
          updatedAt: new Date(),
        },
        { merge: true }
      )
    );
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const user = await getUserById(firebaseUser.uid);
      callback(user);
    } else {
      callback(null);
    }
  });
}

