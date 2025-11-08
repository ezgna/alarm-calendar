// テーマ（ライト限定）の選択状態を保持するストア
// 永続化は MMKV（Zustand persist）

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';
import type { Flavor } from './tokens';

type State = {
  flavor: Flavor;
};

type Actions = {
  setFlavor: (f: Flavor) => void;
};

export const useThemeStore = create<State & Actions>()(
  persist(
    (set) => ({
      flavor: 'simple',
      setFlavor: (f) => set({ flavor: f }),
    }),
    {
      name: 'theme-store-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ flavor: s.flavor }),
    }
  )
);

