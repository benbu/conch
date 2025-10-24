// Theme tokens and registry for preview-only chat UI themes

export type ThemeId = string; // allow many preview themes by id
export type SizeVariant = 'compact' | 'cozy' | 'comfortable';
export type LayoutVariant = 'standard' | 'centered' | 'edgeToEdge';

export interface ChatUITokens {
  name: string;
  // Surfaces
  appBackground: string | { gradient: [string, string] };
  cardBackground: string;
  separator: string;
  // Bubbles
  bubbleOwnBg: string;
  bubbleOtherBg: string;
  bubbleOwnText: string;
  bubbleOtherText: string;
  bubbleRadius: number;
  bubbleShadow?: { color: string; opacity: number };
  // Input
  inputBg: string;
  inputBorder: string;
  sendButtonBg: string;
}

export const PREVIEW_THEMES: Record<ThemeId, ChatUITokens> = {
  'glass-aurora': {
    name: 'Glass Aurora',
    appBackground: { gradient: ['rgb(100, 38, 201)', 'rgb(170, 228, 238)'] },
    cardBackground: 'rgba(255,255,255,0.6)',
    separator: 'rgba(255,255,255,0.25)',
    bubbleOwnBg: 'rgba(20,20,20,0.75)',
    bubbleOtherBg: 'rgba(255,255,255,0.85)',
    bubbleOwnText: '#fff',
    bubbleOtherText: '#11181C',
    bubbleRadius: 18,
    bubbleShadow: { color: '#000', opacity: 0.15 },
    inputBg: 'rgba(255,255,255,0.7)',
    inputBorder: 'rgba(0,0,0,0.08)',
    sendButtonBg: '#3B82F6',
  },
  'minimal-light': {
    name: 'Minimal Light',
    appBackground: '#F7F7F7',
    cardBackground: '#FFFFFF',
    separator: '#EAEAEA',
    bubbleOwnBg: '#0A84FF',
    bubbleOtherBg: '#EFEFF4',
    bubbleOwnText: '#FFFFFF',
    bubbleOtherText: '#111111',
    bubbleRadius: 14,
    inputBg: '#FFFFFF',
    inputBorder: '#E5E5EA',
    sendButtonBg: '#0A84FF',
  },
  'amoled-neon': {
    name: 'AMOLED Neon',
    appBackground: '#000000',
    cardBackground: '#0A0A0A',
    separator: '#1A1A1A',
    bubbleOwnBg: '#00E5FF',
    bubbleOtherBg: '#111111',
    bubbleOwnText: '#000000',
    bubbleOtherText: '#EEEEEE',
    bubbleRadius: 16,
    bubbleShadow: { color: '#00E5FF', opacity: 0.3 },
    inputBg: '#0F0F10',
    inputBorder: '#1F1F21',
    sendButtonBg: '#00E5FF',
  },
  'imessage-classic': {
    name: 'iMessage Classic',
    appBackground: '#E5E5EA',
    cardBackground: '#FFFFFF',
    separator: '#D1D1D6',
    bubbleOwnBg: '#0B93F6',
    bubbleOtherBg: '#E5E5EA',
    bubbleOwnText: '#FFFFFF',
    bubbleOtherText: '#000000',
    bubbleRadius: 18,
    inputBg: '#FFFFFF',
    inputBorder: '#D1D1D6',
    sendButtonBg: '#0B93F6',
  },
  // Additional themes
  'glassomorphic': {
    name: 'Glassomorphic',
    appBackground: { gradient: ['#3a1c71', '#d76d77'] },
    cardBackground: 'rgba(255,255,255,0.5)',
    separator: 'rgba(255,255,255,0.3)',
    bubbleOwnBg: 'rgba(0,0,0,0.65)',
    bubbleOtherBg: 'rgba(255,255,255,0.85)',
    bubbleOwnText: '#FFFFFF',
    bubbleOtherText: '#1a1a1a',
    bubbleRadius: 20,
    bubbleShadow: { color: '#000', opacity: 0.2 },
    inputBg: 'rgba(255,255,255,0.6)',
    inputBorder: 'rgba(0,0,0,0.08)',
    sendButtonBg: '#8a2be2',
  },
  'vibrant': {
    name: 'Vibrant',
    appBackground: '#ffffff',
    cardBackground: '#ffffff',
    separator: '#ececec',
    bubbleOwnBg: '#ff006e',
    bubbleOtherBg: '#ffd166',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#111111',
    bubbleRadius: 14,
    inputBg: '#ffffff',
    inputBorder: '#e5e5e5',
    sendButtonBg: '#3a86ff',
  },
  'chill': {
    name: 'Chill',
    appBackground: '#e6f3ff',
    cardBackground: '#ffffff',
    separator: '#d6e6f2',
    bubbleOwnBg: '#37b6ff',
    bubbleOtherBg: '#f0f7ff',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#0f172a',
    bubbleRadius: 16,
    inputBg: '#ffffff',
    inputBorder: '#d6e6f2',
    sendButtonBg: '#2563eb',
  },
  'electric': {
    name: 'Electric',
    appBackground: '#0b0f19',
    cardBackground: '#111827',
    separator: '#1f2937',
    bubbleOwnBg: '#7c3aed',
    bubbleOtherBg: '#0b0f19',
    bubbleOwnText: '#e0e7ff',
    bubbleOtherText: '#cbd5e1',
    bubbleRadius: 18,
    bubbleShadow: { color: '#7c3aed', opacity: 0.35 },
    inputBg: '#0f172a',
    inputBorder: '#1f2937',
    sendButtonBg: '#06b6d4',
  },
  'spacey': {
    name: 'Spacey',
    appBackground: '#0b0b2b',
    cardBackground: '#151542',
    separator: '#262658',
    bubbleOwnBg: '#5b21b6',
    bubbleOtherBg: '#111133',
    bubbleOwnText: '#e9d5ff',
    bubbleOtherText: '#c7d2fe',
    bubbleRadius: 20,
    inputBg: '#0f103a',
    inputBorder: '#262658',
    sendButtonBg: '#a78bfa',
  },
  'futuristic': {
    name: 'Futuristic',
    appBackground: '#0a0a0a',
    cardBackground: '#0f0f0f',
    separator: '#1a1a1a',
    bubbleOwnBg: '#00f0ff',
    bubbleOtherBg: '#121212',
    bubbleOwnText: '#001013',
    bubbleOtherText: '#e6fbff',
    bubbleRadius: 16,
    bubbleShadow: { color: '#00f0ff', opacity: 0.4 },
    inputBg: '#0c0c0c',
    inputBorder: '#1a1a1a',
    sendButtonBg: '#00f0ff',
  },
  'modern': {
    name: 'Modern',
    appBackground: '#fafafa',
    cardBackground: '#ffffff',
    separator: '#efefef',
    bubbleOwnBg: '#111827',
    bubbleOtherBg: '#f3f4f6',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#111827',
    bubbleRadius: 14,
    inputBg: '#ffffff',
    inputBorder: '#e5e7eb',
    sendButtonBg: '#111827',
  },
  'sleek': {
    name: 'Sleek',
    appBackground: '#0f1115',
    cardBackground: '#141821',
    separator: '#1f2733',
    bubbleOwnBg: '#2dd4bf',
    bubbleOtherBg: '#161b25',
    bubbleOwnText: '#052522',
    bubbleOtherText: '#e2e8f0',
    bubbleRadius: 18,
    inputBg: '#0f141f',
    inputBorder: '#1f2733',
    sendButtonBg: '#2dd4bf',
  },
  'pastel': {
    name: 'Pastel',
    appBackground: '#fff7f7',
    cardBackground: '#ffffff',
    separator: '#f4e2e2',
    bubbleOwnBg: '#f472b6',
    bubbleOtherBg: '#fde2e4',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#111111',
    bubbleRadius: 18,
    inputBg: '#ffffff',
    inputBorder: '#f4e2e2',
    sendButtonBg: '#ec4899',
  },
  'sunset': {
    name: 'Sunset',
    appBackground: '#fff1e6',
    cardBackground: '#ffffff',
    separator: '#ffe0cc',
    bubbleOwnBg: '#fb5607',
    bubbleOtherBg: '#ffd6a5',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#4a2100',
    bubbleRadius: 18,
    inputBg: '#ffffff',
    inputBorder: '#ffe0cc',
    sendButtonBg: '#ff006e',
  },
  'midnight': {
    name: 'Midnight',
    appBackground: '#0b132b',
    cardBackground: '#1c2541',
    separator: '#3a506b',
    bubbleOwnBg: '#5bc0be',
    bubbleOtherBg: '#0b132b',
    bubbleOwnText: '#071a1a',
    bubbleOtherText: '#e0fbfc',
    bubbleRadius: 16,
    inputBg: '#1c2541',
    inputBorder: '#3a506b',
    sendButtonBg: '#5bc0be',
  },
  'oceanic': {
    name: 'Oceanic',
    appBackground: '#e0fbfc',
    cardBackground: '#ffffff',
    separator: '#c2e9eb',
    bubbleOwnBg: '#3a86ff',
    bubbleOtherBg: '#a8dadc',
    bubbleOwnText: '#ffffff',
    bubbleOtherText: '#003049',
    bubbleRadius: 16,
    inputBg: '#ffffff',
    inputBorder: '#c2e9eb',
    sendButtonBg: '#00b4d8',
  },
};

export function getPreviewTheme(themeId?: string | string[] | null): ChatUITokens | null {
  const key = Array.isArray(themeId) ? themeId[0] : themeId;
  if (!key) return null;
  if (Object.prototype.hasOwnProperty.call(PREVIEW_THEMES, key)) {
    return PREVIEW_THEMES[key as ThemeId];
  }
  return null;
}


