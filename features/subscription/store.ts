// RevenueCat 購入/権限の簡易ストア
// - isPremium: Entitlements に 'premium' が存在するか
// - 操作用のユーティリティ: 購入/復元/同期

import { create } from 'zustand';
import Purchases, { PurchasesError, PURCHASES_ERROR_CODE } from 'react-native-purchases';

// 開発ビルドでは常にPremium扱いにする（本番ビルドでは false）
// const DEV_PREMIUM = __DEV__;
const DEV_PREMIUM = false;

type State = {
  isPremium: boolean;
  lastMessage?: string;
  busy: boolean;
  hydrated: boolean;
};

type Actions = {
  setIsPremium: (v: boolean) => void;
  refreshFromPurchases: () => Promise<void>;
  purchaseDefaultPackage: () => Promise<void>;
  restore: () => Promise<void>;
  clearMessage: () => void;
};

export const useSubscriptionStore = create<State & Actions>((set) => ({
  isPremium: DEV_PREMIUM,
  busy: false,
   hydrated: DEV_PREMIUM,
  lastMessage: undefined,

  setIsPremium: (v) => set({ isPremium: v }),

  refreshFromPurchases: async () => {
    if (DEV_PREMIUM) {
      set({ isPremium: true, lastMessage: 'Dev mode: Premium unlocked', hydrated: true });
      return;
    }
    try {
      set({ busy: true, lastMessage: undefined });
      const info = await Purchases.getCustomerInfo();
      console.log('[subs] refreshFromPurchases customerInfo', JSON.stringify({
        entitlements: info.entitlements,
        activeSubscriptions: info.activeSubscriptions,
      }, null, 2));
      const active = info.entitlements.active as any;
      const isPremium = !!active?.premium;
      console.log('[subs] refreshFromPurchases active.premium =', !!active?.premium);
      set({ isPremium, lastMessage: isPremium ? 'Premiumが有効です' : 'Premiumは未購入です', hydrated: true });
    } catch (e) {
      const err = e as PurchasesError;
      set({ lastMessage: `権限確認に失敗: ${err?.message ?? '不明なエラー'}`, hydrated: true });
    } finally {
      set({ busy: false });
    }
  },

  purchaseDefaultPackage: async () => {
    if (DEV_PREMIUM) {
      set({ isPremium: true, lastMessage: 'Dev mode: Premium unlocked', hydrated: true });
      return;
    }
    try {
      set({ busy: true, lastMessage: undefined });
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      const pkg = current?.availablePackages?.[0];
      if (!pkg) throw new Error('販売商品が見つからない');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('[subs] purchaseDefaultPackage customerInfo', JSON.stringify({
        entitlements: customerInfo.entitlements,
        activeSubscriptions: customerInfo.activeSubscriptions,
      }, null, 2));
      const active = customerInfo.entitlements.active as any;
      const isPremium = !!active?.premium;
      console.log('[subs] purchaseDefaultPackage active.premium =', !!active?.premium);
      set({ isPremium, lastMessage: isPremium ? '購入完了: Premiumが有効になりました' : '購入済みですが Premium は無効です', hydrated: true });
    } catch (e) {
      const err = e as PurchasesError;
      if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        set({ lastMessage: '購入をキャンセルしました' });
      } else {
        set({ lastMessage: `購入に失敗: ${err?.message ?? '不明なエラー'}` });
      }
    } finally {
      set({ busy: false });
    }
  },

  restore: async () => {
    if (DEV_PREMIUM) {
      set({ isPremium: true, lastMessage: 'Dev mode: Premium unlocked', hydrated: true });
      return;
    }
    try {
      set({ busy: true, lastMessage: undefined });
      const info = await Purchases.restorePurchases();
      console.log('[subs] restore customerInfo', JSON.stringify({
        entitlements: info.entitlements,
        activeSubscriptions: info.activeSubscriptions,
      }, null, 2));
      const active = info.entitlements.active as any;
      const isPremium = !!active?.premium;
      console.log('[subs] restore active.premium =', !!active?.premium);
      set({ isPremium, lastMessage: isPremium ? '購入を復元しました: Premium有効' : '復元しましたが Premium は無効です', hydrated: true });
    } catch (e) {
      const err = e as PurchasesError;
      set({ lastMessage: `復元に失敗: ${err?.message ?? '不明なエラー'}` });
    } finally {
      set({ busy: false });
    }
  },

  clearMessage: () => set({ lastMessage: undefined }),
}));
