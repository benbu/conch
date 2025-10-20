// Authentication service with Firebase
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update profile
    await updateProfile(firebaseUser, { displayName });

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

    await setDoc(doc(db, 'users', user.id), user);

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      
      await setDoc(doc(db, 'users', user.id), user);
    }

    return user;
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
    const userCredential = await signInWithCredential(auth, credential);
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

      await setDoc(doc(db, 'users', user.id), user);
    }

    return user;
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
    await signOut(auth);
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
    await sendPasswordResetEmail(auth, email);
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    
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
      workHours: data.workHours,
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
    await setDoc(
      doc(db, 'users', userId),
      {
        ...updates,
        updatedAt: new Date(),
      },
      { merge: true }
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

