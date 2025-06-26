// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UserAccountモデルに合わせたユーザー情報の型定義
interface UserInfo {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  avatar: string | null;
  introduction: string | null;
  gender: string;
  birthdate: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;
  setUser: (user: UserInfo) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
