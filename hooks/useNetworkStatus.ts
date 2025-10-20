// Hook for monitoring network status
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useNetworkStatus() {
  const { setConnected } = useUIStore();

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setConnected(isConnected);
      
      if (isConnected) {
        console.log('📡 Network connected');
      } else {
        console.log('📡 Network disconnected');
      }
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setConnected(isConnected);
    });

    return () => unsubscribe();
  }, [setConnected]);

  const isConnected = useUIStore(state => state.isConnected);

  return { isConnected };
}

