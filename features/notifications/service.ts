// iOS 既定音のみのローカル通知用 下回りサービス
// - ハンドラ設定（フォアグラウンドでも表示＋音）
// - 権限確認/要求
// - 単発スケジュールと取消

import * as Notifications from "expo-notifications";

const DBG = typeof __DEV__ !== "undefined" ? __DEV__ : true;
const log = (...args: any[]) => {
  if (DBG) {
    console.log("[notif]", ...args);
  }
};

let initialized = false;

export function initializeNotifications() {
  if (initialized) return;
  initialized = true;
  // フォアグラウンド時もアラート/サウンドを出す
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  log("initialized handler (alert + sound in foreground)");
}

export async function ensurePermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!(req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED);
  } catch {
    return false;
  }
}

export async function scheduleOnce(params: { date: Date; title: string; body?: string }): Promise<string | null> {
  try {
    const now = Date.now();
    const at = params.date.getTime();
    if (at <= now) {
      log("skip past date", { nowISO: new Date(now).toISOString(), atISO: new Date(at).toISOString(), title: params.title, body: params.body });
      return null; // 過去は予約しない
    }
    log("scheduleOnce request", { atISO: new Date(at).toISOString(), title: params.title, body: params.body });
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: "default", // 既定音を明示
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: params.date },
    });
    log("scheduled id", id);
    return id;
  } catch {
    return null;
  }
}

export async function cancelMany(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function listScheduled() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [] as Notifications.NotificationRequest[];
  }
}
