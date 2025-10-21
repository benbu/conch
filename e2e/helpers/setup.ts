
/**
 * Check if Firebase emulator is running
 */
export function isEmulatorRunning(): boolean {
  try {
    const response = fetch('http://127.0.0.1:4000');
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for Firebase emulator to be ready
 */
export async function waitForEmulator(timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch('http://127.0.0.1:4000');
      if (response.ok) {
        console.log('✅ Firebase Emulator is ready');
        return;
      }
    } catch {
      // Emulator not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('Firebase Emulator did not start in time');
}

/**
 * Clear all emulator data
 */
export async function clearEmulatorData(): Promise<void> {
  try {
    // Clear Auth
    await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-project/accounts', {
      method: 'DELETE',
    });
    
    // Clear Firestore
    await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-project/databases/(default)/documents', {
      method: 'DELETE',
    });
    
    console.log('✅ Emulator data cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear emulator data:', error);
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Condition not met within timeout');
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


