// 利用規約の同意状態を保持するストア（永続化: MMKV）
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

export const TERMS_VERSION = '2025-11-23'; // 規約本文を更新したら日付などでバージョンを上げる

type State = {
  acceptedVersion: string | null;
  hydrated: boolean;
};

type Actions = {
  accept: (version: string) => void;
  hasAccepted: (version: string) => boolean;
  reset: () => void;
  setHydrated: (v: boolean) => void;
};

export const useTermsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      acceptedVersion: null,
      hydrated: false,
      accept: (version) => set({ acceptedVersion: version }),
      hasAccepted: (version) => get().acceptedVersion === version,
      reset: () => set({ acceptedVersion: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'terms-store-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ acceptedVersion: s.acceptedVersion }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
