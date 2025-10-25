import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessageTranslationsBatch, getMessageTranslation, subscribeToMessageTranslation, TranslationDoc } from '../services/firestoreService';
import { selectUser, useAuthStore } from '../stores/authStore';
import { useTranslationCacheStore } from '../stores/translationCacheStore';

type TranslationState = Record<string, TranslationDoc | null>; // key: messageId

export function useTranslations(conversationId: string | null, messageIds: string[]) {
  const user = useAuthStore(selectUser);
  const [map, setMap] = useState<TranslationState>({});
  // Single live subscription for the latest message
  const latestUnsubRef = useRef<null | (() => void)>(null);
  const latestIdRef = useRef<string | null>(null);
  // Temporary subscriptions for older pending translations
  const tempUnsubsRef = useRef<Record<string, () => void>>({});
  // Track which older ids we have already fetched to avoid duplicate getDoc calls
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId || !user) return;
    const langCode = (user as any)?.defaultLanguage?.toLowerCase?.() || 'en';
    const ids = Array.isArray(messageIds) ? messageIds : [];
    const latestId = ids.length ? ids[ids.length - 1] : null;
    const olderIds = ids.slice(0, -1);

    // Hydrate from cache first for all ids
    if (ids.length > 0) {
      const cached = useTranslationCacheStore.getState().getMany(
        conversationId,
        langCode,
        ids
      );
      setMap((prev) => {
        const next = { ...prev } as TranslationState;
        for (const id of ids) {
          const c = cached[id];
          if (typeof c !== 'undefined' && next[id] === undefined) {
            next[id] = c ?? null;
          }
        }
        return next;
      });
    }

    // Manage the single subscription for the latest message
    if (latestIdRef.current !== latestId) {
      // latest changed → unsubscribe old
      latestUnsubRef.current?.();
      latestUnsubRef.current = null;
      latestIdRef.current = latestId;
    }

    if (latestId && !latestUnsubRef.current) {
      // Ensure no temp sub remains for the latest id
      if (tempUnsubsRef.current[latestId]) {
        tempUnsubsRef.current[latestId]!();
        delete tempUnsubsRef.current[latestId];
      }
      latestUnsubRef.current = subscribeToMessageTranslation(
        conversationId,
        latestId,
        langCode,
        (doc) => {
          setMap((prev) => ({ ...prev, [latestId]: doc }));
        }
      );
    }

    // Determine recent slice (last 15 older ids) and fetch only those not cached
    const RECENT_COUNT = 15;
    const recentOlder = olderIds.slice(-RECENT_COUNT);
    const cache = useTranslationCacheStore.getState();
    const toFetch = recentOlder.filter((id) =>
      !fetchedRef.current.has(id) &&
      !tempUnsubsRef.current[id] &&
      typeof cache.getOne(conversationId, langCode, id) === 'undefined'
    );
    if (toFetch.length > 0) {
      // Mark as fetched to prevent duplicate concurrent fetches
      toFetch.forEach((id) => fetchedRef.current.add(id));

      fetchMessageTranslationsBatch(conversationId, toFetch, langCode)
        .then(async (batch) => {
          // Apply batch results
          setMap((prev) => {
            const next = { ...prev } as TranslationState;
            for (const id of toFetch) {
              const doc = batch[id] ?? null;
              if (next[id] === undefined) {
                next[id] = doc;
              }
            }
            return next;
          });

          // Fallback per-id get for any ids not returned in batch (old docs)
          const missing = toFetch.filter((id) => typeof batch[id] === 'undefined');
          if (missing.length > 0) {
            await Promise.all(
              missing.map(async (id) => {
                try {
                  const doc = await getMessageTranslation(conversationId, id, langCode);
                  setMap((prev) => (prev[id] === undefined || prev[id] === null ? { ...prev, [id]: doc } : prev));
                  // write-through cache
                  useTranslationCacheStore.getState().setOne(conversationId, langCode, id, doc ?? null);
                  if (doc && doc.status === 'pending') {
                    const unsub = subscribeToMessageTranslation(
                      conversationId,
                      id,
                      langCode,
                      (snapDoc) => {
                        setMap((prev) => ({ ...prev, [id]: snapDoc }));
                        // write-through cache
                        useTranslationCacheStore.getState().setOne(conversationId, langCode, id, snapDoc ?? null);
                        const status = snapDoc?.status;
                        if (status === 'completed' || status === 'error') {
                          tempUnsubsRef.current[id]?.();
                          delete tempUnsubsRef.current[id];
                        }
                      }
                    );
                    tempUnsubsRef.current[id] = unsub;
                  }
                } catch {
                  // ignore
                }
              })
            );
          }

          // Start temp subscriptions for any pending docs from batch
          for (const id of toFetch) {
            const doc = batch[id];
            if (doc && doc.status === 'pending' && !tempUnsubsRef.current[id]) {
              const unsub = subscribeToMessageTranslation(
                conversationId,
                id,
                langCode,
                (snapDoc) => {
                  setMap((prev) => ({ ...prev, [id]: snapDoc }));
                  // write-through cache
                  useTranslationCacheStore.getState().setOne(conversationId, langCode, id, snapDoc ?? null);
                  const status = snapDoc?.status;
                  if (status === 'completed' || status === 'error') {
                    tempUnsubsRef.current[id]?.();
                    delete tempUnsubsRef.current[id];
                  }
                }
              );
              tempUnsubsRef.current[id] = unsub;
            }
          }
          // Cache batch results
          const toCache: Record<string, TranslationDoc | null> = {};
          for (const id of toFetch) {
            if (typeof batch[id] !== 'undefined') {
              toCache[id] = batch[id] ?? null;
            }
          }
          if (Object.keys(toCache).length > 0) {
            useTranslationCacheStore.getState().setMany(conversationId, langCode, toCache);
          }
        })
        .catch(() => {
          // On batch error, do nothing; next render can retry
        });
    }

    // Prune state for ids no longer present; and remove temp subs for pruned ids
    const idSet = new Set(ids);
    Object.keys(tempUnsubsRef.current).forEach((id) => {
      if (!idSet.has(id)) {
        tempUnsubsRef.current[id]!();
        delete tempUnsubsRef.current[id];
      }
    });
    setMap((prev) => {
      const next: TranslationState = {};
      for (const id of ids) {
        if (Object.prototype.hasOwnProperty.call(prev, id)) {
          next[id] = prev[id];
        }
      }
      return next;
    });
    // Keep fetched set only for current older ids to avoid growth
    fetchedRef.current = new Set(olderIds);

    return () => {
      // Clean up latest sub on dependency change when conversation/user changes
      latestUnsubRef.current?.();
      latestUnsubRef.current = null;
      latestIdRef.current = null;
      // Clean up temp subs
      for (const k of Object.keys(tempUnsubsRef.current)) {
        tempUnsubsRef.current[k]?.();
      }
      tempUnsubsRef.current = {};
    };
  }, [conversationId, user, JSON.stringify(messageIds)]);

  const get = useMemo(() => {
    return (messageId: string) => map[messageId] || null;
  }, [map]);

  return { get };
}


