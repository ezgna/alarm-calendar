// RevenueCat 購入/権限の簡易ストア
// - isPremium: Entitlements に 'premium' が存在するか
// - 操作用のユーティリティ: 購入/復元/同期

import { create } from 'zustand';
import Purchases, { PurchasesError, PurchasesErrorCode } from 'react-native-purchases';

type State = {
  isPremium: boolean;
  lastMessage?: string;
  busy: boolean;
};

type Actions = {
  setIsPremium: (v: boolean) => void;
  refreshFromPurchases: () => Promise<void>;
  purchaseDefaultPackage: () => Promise<void>;
  restore: () => Promise<void>;
  clearMessage: () => void;
};

export const useSubscriptionStore = create<State & Actions>((set) => ({
  isPremium: false,
  busy: false,
  lastMessage: undefined,

  setIsPremium: (v) => set({ isPremium: v }),

  refreshFromPurchases: async () => {
    try {
      set({ busy: true, lastMessage: undefined });
      const info = await Purchases.getCustomerInfo();
      const active = info.entitlements.active as any;
      const isPremium = !!active?.premium;
      set({ isPremium, lastMessage: isPremium ? 'Premiumが有効です' : 'Premiumは未購入です' });
    } catch (e) {
      const err = e as PurchasesError;
      set({ lastMessage: `権限確認に失敗: ${err?.message ?? '不明なエラー'}` });
    } finally {
      set({ busy: false });
    }
  },

  purchaseDefaultPackage: async () => {
    try {
      set({ busy: true, lastMessage: undefined });
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      const pkg = current?.availablePackages?.[0];
      if (!pkg) throw new Error('販売商品が見つからない');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active as any;
      const isPremium = !!active?.premium;
      set({ isPremium, lastMessage: isPremium ? '購入完了: Premiumが有効になりました' : '購入済みですが Premium は無効です' });
    } catch (e) {
      const err = e as PurchasesError;
      if (err?.code === PurchasesErrorCode.PurchaseCancelledError) {
        set({ lastMessage: '購入をキャンセルしました' });
      } else {
        set({ lastMessage: `購入に失敗: ${err?.message ?? '不明なエラー'}` });
      }
    } finally {
      set({ busy: false });
    }
  },

  restore: async () => {
    try {
      set({ busy: true, lastMessage: undefined });
      const info = await Purchases.restorePurchases();
      const active = info.entitlements.active as any;
      const isPremium = !!active?.premium;
      set({ isPremium, lastMessage: isPremium ? '購入を復元しました: Premium有効' : '復元しましたが Premium は無効です' });
    } catch (e) {
      const err = e as PurchasesError;
      set({ lastMessage: `復元に失敗: ${err?.message ?? '不明なエラー'}` });
    } finally {
      set({ busy: false });
    }
  },

  clearMessage: () => set({ lastMessage: undefined }),
}));
