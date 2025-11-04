// MMKV アダプタ（Zustand persistで利用）
// 依存: react-native-mmkv
import { createMMKV } from 'react-native-mmkv';

export const mmkv = createMMKV({ id: 'alarm-calendar' });

// Zustand の createJSONStorage に渡すためのラッパー
export const mmkvStorage = {
  getItem: (key: string) => {
    try {
      const value = mmkv.getString(key);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      mmkv.set(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      mmkv.remove(key);
    } catch {}
  },
};
