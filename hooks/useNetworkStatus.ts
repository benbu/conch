// Hook for monitoring network status
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useNetworkStatus() {
  const { setConnected } = useUIStore();

  useEffect(() => {
    const offlineTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
    let lastProbeAt = 0;
    let probeInFlight = false;
    let lastLogStatus: 'online' | 'provisional_offline' | 'offline' | null = null;

    const PROBE_THROTTLE_MS = 3000;
    const PROBE_TIMEOUT_MS = 3000;
    const OFFLINE_DEBOUNCE_MS = 3000; // Align with probe to avoid false negatives

    const httpReachabilityProbe = async (): Promise<boolean> => {
      try {
        // Prefer gstatic 204 probe universally
        const primaryUrl = 'https://www.gstatic.com/generate_204';
        const fallbackUrl = 'https://www.apple.com/library/test/success.html';

        const tryProbe = async (url: string, expectStatus: number) => {
          const timeoutPromise = new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), PROBE_TIMEOUT_MS)
          );
          const fetchPromise = fetch(url, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
          }).then((resp) => resp.status === expectStatus);
          return await Promise.race<boolean>([fetchPromise, timeoutPromise]);
        };

        const primaryOk = await tryProbe(primaryUrl, 204);
        if (primaryOk) return true;
        const fallbackOk = await tryProbe(fallbackUrl, 200);
        return fallbackOk;
      } catch (e) {
        return false;
      }
    };

    const applyConnectivity = (connected: boolean) => {
      if (connected) {
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        }
        setConnected(true);
      } else {
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
        }
        offlineTimerRef.current = setTimeout(() => {
          setConnected(false);
        }, OFFLINE_DEBOUNCE_MS);
      }
    };

    const evaluateState = (state: any) => {
      // Determine connectivity using transport type and reachability
      const hasTransport = state.type !== 'none' && state.type !== 'unknown';
      // On iOS, isInternetReachable can be null while checking; treat null as provisional true
      const reachable = state.isInternetReachable == null ? true : state.isInternetReachable === true;
      const isConnected = hasTransport && reachable;
      if (isConnected) {
        applyConnectivity(true);
        if (lastLogStatus !== 'online') {
          console.log('📡 Network connected', {
            type: state.type,
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
          });
          lastLogStatus = 'online';
        }
      } else {
        // Fallback: run a throttled HTTP reachability probe to override false negatives
        const now = Date.now();
        if (!probeInFlight && now - lastProbeAt >= PROBE_THROTTLE_MS) {
          probeInFlight = true;
          lastProbeAt = now;
          if (lastLogStatus !== 'provisional_offline') {
            console.log('📡 NetInfo reports offline (probing reachability)...', {
              type: state.type,
              isConnected: state.isConnected,
              isInternetReachable: state.isInternetReachable,
            });
            lastLogStatus = 'provisional_offline';
          }
          httpReachabilityProbe().then((reachableNow) => {
            probeInFlight = false;
            if (reachableNow) {
              applyConnectivity(true);
              if (lastLogStatus !== 'online') {
                console.log('📡 Reachability probe: online (overriding NetInfo)', {
                  type: state.type,
                });
                lastLogStatus = 'online';
              }
            } else {
              applyConnectivity(false);
              if (lastLogStatus !== 'offline') {
                console.log('📡 Offline confirmed after probe', {
                  type: state.type,
                });
                lastLogStatus = 'offline';
              }
            }
          });
        } else {
          applyConnectivity(false);
          if (lastLogStatus !== 'provisional_offline') {
            console.log('📡 NetInfo reports offline (debouncing)...', {
              type: state.type,
              isConnected: state.isConnected,
              isInternetReachable: state.isInternetReachable,
            });
            lastLogStatus = 'provisional_offline';
          }
        }
      }
    };

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(evaluateState);

    // Get initial state
    NetInfo.fetch().then(evaluateState);

    return () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
      }
      unsubscribe();
    };
  }, [setConnected]);

  const isConnected = useUIStore(state => state.isConnected);

  return { isConnected };
}

