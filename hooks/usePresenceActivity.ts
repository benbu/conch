import { presenceClient } from '@/services/presenceClient';

export function emitPresenceActivity(): void {
  presenceClient.enqueueActivity();
}


