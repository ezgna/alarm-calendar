import { Alert, Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSubscriptionStore } from './store';

// 開発ビルドでも課金フローを通して挙動確認できるよう、強制 Premium は無効化
const DEV_PREMIUM = false;

// Premium解放のための共通ヘルパー
// - 既にPremiumなら即true
// - そうでなければPaywallを表示し、権限を同期してから結果を返す
export async function requirePremium(): Promise<boolean> {
  try {
    if (DEV_PREMIUM) {
      useSubscriptionStore.getState().setIsPremium(true);
      return true;
    }

    if (useSubscriptionStore.getState().isPremium) {
      return true;
    }

    if (Platform.OS === 'android') {
      Alert.alert('Premium', 'Android版では現在Premium購入に対応していません。');
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'premium',
      });

      const ok =
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        result === PAYWALL_RESULT.NOT_PRESENTED;

      await useSubscriptionStore.getState().refreshFromPurchases();
      if (!ok) {
        return useSubscriptionStore.getState().isPremium;
      }
      return useSubscriptionStore.getState().isPremium;
    } catch (err) {
      console.warn('[requirePremium] paywall error', err);
      try {
        await useSubscriptionStore.getState().refreshFromPurchases();
      } catch {}
      return useSubscriptionStore.getState().isPremium;
    }
  } catch (err) {
    console.warn('[requirePremium] unexpected error', err);
    return false;
  }
}
