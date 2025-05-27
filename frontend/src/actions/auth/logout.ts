'use client';

import { useAuthStore } from '@/store/useAuthStore';
import {showLogoutToast} from "@/utils/toasts";

export const logoutUser = () => {
  // トークン削除
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  // Zustandストア初期化
  useAuthStore.getState().clearAuth();

  showLogoutToast();
};