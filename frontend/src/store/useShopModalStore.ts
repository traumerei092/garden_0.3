
import { create } from 'zustand';

interface ShopModalState {
  isEditModalOpen: boolean;
  isHistoryModalOpen: boolean;
  openEditModal: () => void;
  closeEditModal: () => void;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
}

export const useShopModalStore = create<ShopModalState>((set) => ({
  isEditModalOpen: false,
  isHistoryModalOpen: false,
  openEditModal: () => set({ isEditModalOpen: true }),
  closeEditModal: () => set({ isEditModalOpen: false }),
  openHistoryModal: () => set({ isHistoryModalOpen: true }),
  closeHistoryModal: () => set({ isHistoryModalOpen: false }),
}));
