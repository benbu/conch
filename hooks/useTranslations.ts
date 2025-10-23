import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribeToMessageTranslation, TranslationDoc } from '../services/firestoreService';
import { selectUser, useAuthStore } from '../stores/authStore';

type TranslationState = Record<string, TranslationDoc | null>; // key: messageId

export function useTranslations(conversationId: string | null, messageIds: string[]) {
  const user = useAuthStore(selectUser);
  const [map, setMap] = useState<TranslationState>({});
  const unsubRefs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    // Cleanup previous subscriptions when list changes
    for (const k of Object.keys(unsubRefs.current)) {
      unsubRefs.current[k]?.();
    }
    unsubRefs.current = {};
    setMap({});

    if (!conversationId || !user) return;
    const langCode = (user as any)?.defaultLanguage?.toLowerCase?.() || 'en';

    messageIds.forEach((messageId) => {
      const unsub = subscribeToMessageTranslation(
        conversationId,
        messageId,
        langCode,
        (doc) => {
          setMap((prev) => ({ ...prev, [messageId]: doc }));
        }
      );
      unsubRefs.current[messageId] = unsub;
    });

    return () => {
      for (const k of Object.keys(unsubRefs.current)) {
        unsubRefs.current[k]?.();
      }
      unsubRefs.current = {};
    };
  }, [conversationId, user, JSON.stringify(messageIds)]);

  const get = useMemo(() => {
    return (messageId: string) => map[messageId] || null;
  }, [map]);

  return { get };
}


