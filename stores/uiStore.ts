// UI state store using Zustand
import { create } from 'zustand';
import { ModalType } from '../types';

interface UIStore {
  // State
  activeModal: ModalType;
  modalData: any; // Data to pass to modal
  isConnected: boolean;
  globalLoading: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | null;
  
  // Actions
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  setConnected: (connected: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  activeModal: 'none',
  modalData: null,
  isConnected: true,
  globalLoading: false,
  toastMessage: null,
  toastType: null,

  // Actions
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  
  closeModal: () => set({ activeModal: 'none', modalData: null }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  showToast: (message, type) => set({ toastMessage: message, toastType: type }),
  
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));

// Selectors
export const selectActiveModal = (state: UIStore) => state.activeModal;
export const selectModalData = (state: UIStore) => state.modalData;
export const selectIsConnected = (state: UIStore) => state.isConnected;
export const selectGlobalLoading = (state: UIStore) => state.globalLoading;
export const selectToast = (state: UIStore) => ({
  message: state.toastMessage,
  type: state.toastType,
});

