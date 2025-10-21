import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

let isEmulatorConnected = false;

/**
 * Connect Firebase services to the emulator
 * Call this before initializing your app in tests
 */
export function connectToEmulator() {
  if (isEmulatorConnected) {
    console.log('✅ Already connected to Firebase Emulator');
    return;
  }

  try {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    // Connect to Auth Emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    
    // Connect to Firestore Emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    
    // Connect to Storage Emulator
    connectStorageEmulator(storage, '127.0.0.1', 9199);

    isEmulatorConnected = true;
    console.log('✅ Connected to Firebase Emulator');
  } catch (error) {
    console.error('❌ Error connecting to Firebase Emulator:', error);
    throw error;
  }
}

/**
 * Reset the emulator connection flag (for testing)
 */
export function resetEmulatorConnection() {
  isEmulatorConnected = false;
}


