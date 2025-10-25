import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TranslationDoc } from '../services/firestoreService';

type LangKey = string; // lowercased ISO code

interface TranslationCacheStore {
  // cache[conversationId][lang][messageId] = TranslationDoc | null
  cache: Record<string, Record<LangKey, Record<string, TranslationDoc | null>>>;

  getOne: (
    conversationId: string,
    lang: string,
    messageId: string
  ) => TranslationDoc | null | undefined;

  getMany: (
    conversationId: string,
    lang: string,
    messageIds: string[]
  ) => Record<string, TranslationDoc | null | undefined>;

  setOne: (
    conversationId: string,
    lang: string,
    messageId: string,
    doc: TranslationDoc | null
  ) => void;

  setMany: (
    conversationId: string,
    lang: string,
    docsByMessageId: Record<string, TranslationDoc | null>
  ) => void;

  clearConversationLang: (conversationId: string, lang: string) => void;
}

export const useTranslationCacheStore = create<TranslationCacheStore>()(
  persist(
    (set, get) => ({
      cache: {},

      getOne: (conversationId, lang, messageId) => {
        const c = get().cache;
        const lc = c[conversationId];
        const ll = lc?.[lang.toLowerCase()];
        return ll?.[messageId];
      },

      getMany: (conversationId, lang, messageIds) => {
        const out: Record<string, TranslationDoc | null | undefined> = {};
        const c = get().cache;
        const lc = c[conversationId];
        const ll = lc?.[lang.toLowerCase()];
        for (const id of messageIds) {
          out[id] = ll?.[id];
        }
        return out;
      },

      setOne: (conversationId, lang, messageId, doc) => {
        set((state) => {
          const langKey = lang.toLowerCase();
          const byConv = state.cache[conversationId] || {};
          const byLang = byConv[langKey] || {};
          return {
            cache: {
              ...state.cache,
              [conversationId]: {
                ...byConv,
                [langKey]: {
                  ...byLang,
                  [messageId]: doc,
                },
              },
            },
          };
        });
      },

      setMany: (conversationId, lang, docsByMessageId) => {
        set((state) => {
          const langKey = lang.toLowerCase();
          const byConv = state.cache[conversationId] || {};
          const byLang = byConv[langKey] || {};
          return {
            cache: {
              ...state.cache,
              [conversationId]: {
                ...byConv,
                [langKey]: {
                  ...byLang,
                  ...docsByMessageId,
                },
              },
            },
          };
        });
      },

      clearConversationLang: (conversationId, lang) => {
        set((state) => {
          const langKey = lang.toLowerCase();
          const byConv = { ...(state.cache[conversationId] || {}) };
          if (byConv[langKey]) {
            delete byConv[langKey];
          }
          return {
            cache: {
              ...state.cache,
              [conversationId]: byConv,
            },
          };
        });
      },
    }),
    {
      name: 'translation-cache-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cache: state.cache }),
      version: 1,
    }
  )
);


