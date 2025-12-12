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
import { StatusBar } from 'expo-status-bar';
import { TermsGate } from "@/components/terms/TermsGate";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { useCalendarStore } from "../features/calendar/store";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const rebuildIndex = useEventStore((s) => s.rebuildIndex);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const subHydrated = useSubscriptionStore((s) => s.hydrated);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: "appl_laqfZVBJkcTrHBwFRunTgmwimmu" });
    }
  }, []);

  useEffect(() => {
    try {
      useAdsStore.getState().setAdsRemoved(isPremium);
    } catch {}
  }, [isPremium]);

  // 起動時に購入状態を同期（失敗は無視）
  useEffect(() => {
    try {
      useSubscriptionStore.getState().refreshFromPurchases();
    } catch {}
  }, []);

  // SplashScreen を少なくとも0.5秒表示しつつ、
  // 購入状態の同期完了後に非表示にする
  useEffect(() => {
    if (Platform.OS !== "ios") {
      // iOS 以外は単純に0.5秒表示してから非表示にする
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!subHydrated) return;

    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [subHydrated]);

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
        // バックグラウンドからフォアグラウンドへ戻ったタイミングで、
        // カレンダーの日付を常に「今日」に揃える
        try {
          useCalendarStore.getState().goToday();
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
      <TermsGate>
        <SubscriptionGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
            <Stack.Screen name="(modal)" options={{ presentation: "modal" }} />
          </Stack>
          <StatusBar style="dark" />
        </SubscriptionGate>
      </TermsGate>
    </GestureHandlerRootView>
  );
}
