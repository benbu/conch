// Firebase client initialization and shared instances
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// React Native persistence for Firebase Auth (works in Expo bare/managed)
// Optional import for React Native environments; falls back on default if unavailable
let getReactNativePersistence: any;
let ReactNativeAsyncStorage: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    getReactNativePersistence = require('firebase/auth/react-native').getReactNativePersistence;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
    getReactNativePersistence = undefined;
    ReactNativeAsyncStorage = undefined;
}

// Use Expo public env vars (must be defined in app config or .env)
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app = getApps().length ? getApp() : undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let rtdb: Database | undefined;
let storage: FirebaseStorage | undefined;

export function initializeFirebase(): void {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig as any);
    } else {
        app = getApp();
    }

    // Initialize Auth with RN persistence when possible
    if (!auth) {
        if (getReactNativePersistence && ReactNativeAsyncStorage) {
            try {
                auth = initializeAuth(app!, {
                    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
                });
            } catch {
                auth = getAuth(app!);
            }
        } else {
            auth = getAuth(app!);
        }
    }

    if (!db) db = getFirestore(app!);
    if (!rtdb) rtdb = getDatabase(app!);
    if (!storage) storage = getStorage(app!);
}

// Getter helpers for services that lazy-init if needed
export function getFirebaseAuth(): Auth {
    if (!auth) initializeFirebase();
    return auth!;
}

export function getFirebaseDB(): Firestore {
    if (!db) initializeFirebase();
    return db!;
}

export function getFirebaseRealtimeDB(): Database {
    if (!rtdb) initializeFirebase();
    return rtdb!;
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!storage) initializeFirebase();
    return storage!;
}

// Commonly used named exports for convenience in some modules
// Note: Accessors ensure initialization first
initializeFirebase();
export { auth, db };


