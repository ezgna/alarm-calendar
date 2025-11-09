// アプリ全体の一般設定ストア（MMKV 永続化）
// 現状: 月カレンダーのタップ挙動のみ

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

export type DayTapBehavior = 'openDay' | 'openNewModal';

type State = {
  dayTapBehavior: DayTapBehavior;
};

type Actions = {
  setDayTapBehavior: (b: DayTapBehavior) => void;
};

export const usePreferencesStore = create<State & Actions>()(
  persist(
    (set) => ({
      dayTapBehavior: 'openDay',
      setDayTapBehavior: (b) => set({ dayTapBehavior: b }),
    }),
    {
      name: 'preferences-store-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ dayTapBehavior: s.dayTapBehavior }),
    }
  )
);

