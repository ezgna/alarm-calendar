import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from '../storage/mmkv';

type AdsState = {
  showBanner: boolean;
  adsRemoved: boolean;
  // 同意・初期化の完了状態（バナー描画のガードに使用）
  consentResolved: boolean;
  adsReady: boolean;
};

type AdsActions = {
  show: () => void;
  hide: () => void;
  // set: (v: boolean) => void;
  // removeAds: () => void;
  // restoreAds: () => void;
  setAdsRemoved: (v: boolean) => void;
  setConsentResolved: (v: boolean) => void;
  setAdsReady: (v: boolean) => void;
};

export const useAdsStore = create<AdsState & AdsActions>()(
  persist(
    (set) => ({
      showBanner: true,
      adsRemoved: false,
      consentResolved: false,
      adsReady: false,

      show: () => set({ showBanner: true }),
      hide: () => set({ showBanner: false }),
      // set: (v) => set({ showBanner: v }),
      // removeAds: () => set({ adsRemoved: true }),
      // restoreAds: () => set({ adsRemoved: false }),
      setAdsRemoved: (v) => set({ adsRemoved: v }),
      setConsentResolved: (v) => set({ consentResolved: v }),
      setAdsReady: (v) => set({ adsReady: v }),
    }),
    {
      name: "ads-store-v1",
      storage: createJSONStorage(() => mmkvStorage),
      // セッションベースの状態は永続化しない
      partialize: (s) => ({ adsRemoved: s.adsRemoved }),
    }
  )
);
