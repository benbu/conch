// Firebase configuration and initialization
import NetInfo from '@react-native-community/netinfo';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDatabaseEmulator, Database, getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration
// TODO: Replace with your actual Firebase config or use environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://your-project-id-default-rtdb.firebaseio.com',
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let realtimeDb: Database;
let isEmulatorConnected = false;
let isNetInfoConfigured = false;

/**
 * Configure NetInfo for reliable iOS/Android reachability checks
 */
function configureNetInfo() {
  if (isNetInfoConfigured) {
    return;
  }

  try {
    NetInfo.configure({
      reachabilityUrl: 'https://www.gstatic.com/generate_204',
      reachabilityTest: async (response) => response.status === 204,
      reachabilityShortTimeout: 5000,
      reachabilityLongTimeout: 60000,
    });
    isNetInfoConfigured = true;
    console.log('✅ NetInfo configured for', Platform.OS);
  } catch (error) {
    console.error('❌ Error configuring NetInfo:', error);
  }
}

export function initializeFirebase() {
  try {
    // Configure NetInfo first, before any network checks
    configureNetInfo();

    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
    } else {
      app = getApp();
      console.log('✅ Firebase already initialized');
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    realtimeDb = getDatabase(app);

    // Connect to emulator if enabled
    if (process.env.USE_FIREBASE_EMULATOR === 'true' && !isEmulatorConnected) {
      connectToEmulator();
    }

    return { app, auth, db, storage, realtimeDb };
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

/**
 * Connect Firebase services to the emulator
 * Call this in tests or when USE_FIREBASE_EMULATOR=true
 */
export function connectToEmulator() {
  if (isEmulatorConnected) {
    console.log('✅ Already connected to Firebase Emulator');
    return;
  }

  try {
    if (!auth || !db || !storage || !realtimeDb) {
      throw new Error('Firebase services must be initialized before connecting to emulator');
    }

    // Connect to Auth Emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    
    // Connect to Firestore Emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    
    // Connect to Storage Emulator
    connectStorageEmulator(storage, '127.0.0.1', 9199);

    // Connect to Realtime Database Emulator
    connectDatabaseEmulator(realtimeDb, '127.0.0.1', 9000);

    isEmulatorConnected = true;
    console.log('✅ Connected to Firebase Emulator');
  } catch (error) {
    console.error('❌ Error connecting to Firebase Emulator:', error);
    throw error;
  }
}

// Export Firebase services
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export function getFirebaseDB(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
}

export function getFirebaseRealtimeDB(): Database {
  if (!realtimeDb) {
    initializeFirebase();
  }
  return realtimeDb;
}

export { auth, db, realtimeDb, storage };

