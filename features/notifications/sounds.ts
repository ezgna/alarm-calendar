export type SoundId =
  | 'default'
  | 'ding'
  | 'phoneRingtone'
  | 'refreshingWakeup'
  | 'smartphoneRingtone'
  | 'telephoneRingtone';

// ファイル名は app.json の expo-notifications.sounds に登録したものと一致させる
export const SOUND_CATALOG: Record<Exclude<SoundId, 'default'>, string> = {
  ding: 'ding.wav',
  phoneRingtone: 'phone-ringtone.wav',
  refreshingWakeup: 'refreshing_wakeup.wav',
  smartphoneRingtone: 'smartphone-ringtone.wav',
  telephoneRingtone: 'telephone-ringtone.wav',
};

// iOS: NotificationContent.sound へ渡す値を解決
// 既定音は 'default'、カスタムは「ファイル名だけ」（パスなし）
export const resolveIosSound = (id?: SoundId): string => {
  if (!id || id === 'default') return 'default';
  return SOUND_CATALOG[id];
};

// UI用の選択肢（表示名はお好みで）
export const SOUND_OPTIONS: { id: SoundId; label: string }[] = [
  { id: 'default',          label: 'デフォルト' },
  { id: 'ding',             label: 'ディング' },
  { id: 'phoneRingtone',    label: 'クラシックベル' },
  { id: 'smartphoneRingtone', label: 'スマホ着信' },
  { id: 'telephoneRingtone', label: '黒電話' },
  { id: 'refreshingWakeup', label: 'さわやか' },
];
