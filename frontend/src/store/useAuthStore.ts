// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;
  setUser: (user: { id: number; name: string; email: string }) => void;
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
