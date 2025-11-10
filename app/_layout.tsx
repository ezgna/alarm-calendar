import { Stack } from "expo-router";
import "../global.css";
import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useEventStore } from "../features/events/store";
import { currentTimeZone } from "../lib/date";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initializeNotifications, ensurePermissions } from "../features/notifications/service";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useSubscriptionStore } from "../features/subscription/store";
import { getTrackingPermissionsAsync, PermissionStatus, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import mobileAds from "react-native-google-mobile-ads";
import { setConsent } from "@/lib/ads/consent";
import { useAdsStore } from "@/features/ads/store";

export default function RootLayout() {
  const rebuildIndex = useEventStore((s) => s.rebuildIndex);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: "test_mXwQWRRvWDUEssZMppWeEKNfBHH" });
    }
  }, []);

  // 起動時に購入状態を同期（失敗は無視）
  useEffect(() => {
    try {
      useSubscriptionStore.getState().refreshFromPurchases();
    } catch {}
  }, []);

  useEffect(() => {
    // 通知の初期化（フォアグラウンド表示＋権限確認）
    try {
      initializeNotifications();
      // 許可ダイアログは初回のみ。失敗してもアプリは継続。
      ensurePermissions().catch(() => {});
    } catch {}

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        try {
          rebuildIndex(currentTimeZone());
        } catch {}
      }
    });
    return () => sub.remove();
  }, [rebuildIndex]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "ios") {
        let { status: trackingStatus } = await getTrackingPermissionsAsync();
        if (trackingStatus === PermissionStatus.UNDETERMINED) {
          const req = await requestTrackingPermissionsAsync();
          trackingStatus = req.status;
        }

        const npa = trackingStatus !== PermissionStatus.GRANTED;
        setConsent(npa);
        try { useAdsStore.getState().setConsentResolved(true); } catch {}
      }
      await mobileAds().initialize();
      try { useAdsStore.getState().setAdsReady(true); } catch {}

      if (__DEV__) {
        try {
          // await mobileAds().openAdInspector();
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(modal)" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
