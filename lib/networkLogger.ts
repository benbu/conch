type Phase = 'start' | 'success' | 'error' | 'subscribe' | 'unsubscribe';
import { getFirebaseAuth } from './firebase';

function now(): number {
  return Date.now();
}

function safeData(data: any): any {
  try {
    if (data == null) return data;
    const s = JSON.stringify(data);
    // Truncate large payloads
    if (s.length > 1000) return s.slice(0, 1000) + '…';
    return data;
  } catch {
    return undefined;
  }
}

function shortPath(service: 'rtdb' | 'firestore' | 'auth' | 'storage' | 'http', path: string): string {
  if (!path) return '';
  if (service === 'rtdb') {
    try {
      if (path.startsWith('http')) {
        const u = new URL(path);
        return u.pathname.replace(/^\/+/, '');
      }
    } catch {}
    // Fallback: remove protocol-ish prefix
    const idx = path.indexOf('/presence/');
    if (idx >= 0) return path.slice(idx + 1); // remove leading slash
  }
  return path;
}

export function networkLog(
  service: 'rtdb' | 'firestore' | 'auth' | 'storage' | 'http',
  op: string,
  path: string,
  phase: Phase,
  extra?: Record<string, unknown>
): void {
  try {
    const auth = getFirebaseAuth();
    const u = auth?.currentUser;
    const who = u?.displayName || u?.email || u?.uid || 'anon';
    const p = shortPath(service, path);
    const values: Array<string | number> = [service, op, p, phase];
    if (extra && typeof extra.ms === 'number') values.push(`${extra.ms}ms`);
    if (extra && typeof extra.error !== 'undefined') values.push(String(extra.error));
    if (extra && typeof (extra as any).payload !== 'undefined') values.push(JSON.stringify(safeData((extra as any).payload)) as any);
    console.log(`[${who}] [net] ${values.join(' | ')}`);
  } catch {
    // noop
  }
}

export async function withNetworkLog<T>(
  service: 'rtdb' | 'firestore' | 'auth' | 'storage' | 'http',
  op: string,
  path: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const startAt = now();
  networkLog(service, op, path, 'start', meta);
  try {
    const res = await fn();
    networkLog(service, op, path, 'success', { ms: now() - startAt });
    return res;
  } catch (error: any) {
    networkLog(service, op, path, 'error', { ms: now() - startAt, error: safeData(error?.message || String(error)) });
    throw error;
  }
}


