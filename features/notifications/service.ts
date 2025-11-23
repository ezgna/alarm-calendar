// ローカル通知 下回りサービス（iOS: カスタムサウンド対応）
// - ハンドラ設定（フォアグラウンドでも表示＋音）
// - 権限確認/要求
// - 単発スケジュールと取消（iOSは NotificationContent.sound に 'default' または同梱ファイル名を指定）

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { DEFAULT_SOUND_FILENAME, resolveIosSound, SOUND_CATALOG, type SoundId } from "./sounds";

const DBG = typeof __DEV__ !== "undefined" ? __DEV__ : true;
const log = (...args: any[]) => {
  if (DBG) {
    console.log("[notif]", ...args);
  }
};

let initialized = false;
let androidChannelsPrepared = false;

const ANDROID_CHANNELS: Record<SoundId, { id: string; name: string; sound: string | null }> = {
  default: { id: "reminder-default", name: "リマインダー（既定）", sound: DEFAULT_SOUND_FILENAME }, // 端末既定ではなく ding.wav を利用
  phoneRingtone: { id: "reminder-phone", name: "リマインダー（クラシックベル）", sound: SOUND_CATALOG.phoneRingtone },
  smartphoneRingtone: { id: "reminder-smartphone", name: "リマインダー（スマホ着信）", sound: SOUND_CATALOG.smartphoneRingtone },
  telephoneRingtone: { id: "reminder-telephone", name: "リマインダー（黒電話）", sound: SOUND_CATALOG.telephoneRingtone },
  xylophone: { id: "reminder-xylophone", name: "リマインダー（木琴）", sound: SOUND_CATALOG.xylophone },
};

const resolveAndroidChannelId = (soundId?: SoundId | string) => {
  if (!soundId) return ANDROID_CHANNELS.default.id;
  return ANDROID_CHANNELS[soundId as SoundId]?.id ?? ANDROID_CHANNELS.default.id;
};

async function ensureAndroidChannels() {
  if (androidChannelsPrepared || Platform.OS !== "android") return;
  androidChannelsPrepared = true;
  const entries = Object.values(ANDROID_CHANNELS);
  await Promise.all(
    entries.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: Notifications.AndroidImportance.HIGH,
        sound: channel.sound ?? "default",
        enableVibrate: true,
        enableLights: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFFFFFFF",
      })
    )
  );
  log("android channels prepared", entries.map((c) => c.id));
}

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
  ensureAndroidChannels().catch(() => {});
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

export async function scheduleOnce(params: {
  date: Date;
  title: string;
  body?: string;
  soundId?: SoundId; // ← 追加：'default' | 'phoneRingtone' | 'smartphoneRingtone' | 'telephoneRingtone' | 'xylophone'
}): Promise<string | null> {
  try {
    const now = Date.now();
    const at = params.date.getTime();
    if (at <= now) {
      log("skip past date", {
        nowISO: new Date(now).toISOString(),
        atISO: new Date(at).toISOString(),
        title: params.title,
        body: params.body,
      });
      return null; // 過去は予約しない
    }

    // iOS: 'ding.wav'（既定も同じ）か 'xxx.wav'（パスなし）を渡す
    if (Platform.OS === "android") {
      await ensureAndroidChannels();
    }

    const iosSound = resolveIosSound(params.soundId);
    const channelId = resolveAndroidChannelId(params.soundId);

    log("scheduleOnce request", {
      atISO: new Date(at).toISOString(),
      title: params.title,
      body: params.body,
      sound: iosSound,
      channelId,
    });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: iosSound,
      },
      // DATE トリガー（絶対時刻）
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: params.date,
        channelId,
      },
    });

    log("scheduled id", id);
    return id;
  } catch (e) {
    log("scheduleOnce error", String(e));
    return null;
  }
}

// export async function scheduleOnce(params: { date: Date; title: string; body?: string }): Promise<string | null> {
//   try {
//     const now = Date.now();
//     const at = params.date.getTime();
//     if (at <= now) {
//       log("skip past date", { nowISO: new Date(now).toISOString(), atISO: new Date(at).toISOString(), title: params.title, body: params.body });
//       return null; // 過去は予約しない
//     }
//     log("scheduleOnce request", { atISO: new Date(at).toISOString(), title: params.title, body: params.body });
//     const id = await Notifications.scheduleNotificationAsync({
//       content: {
//         title: params.title,
//         body: params.body,
//         sound: "default", // 既定音を明示
//       },
//       trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: params.date },
//     });
//     log("scheduled id", id);
//     return id;
//   } catch {
//     return null;
//   }
// }

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
