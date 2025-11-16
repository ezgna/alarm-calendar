export type SoundId =
  | 'default'
  | 'ding'
  | 'phoneRingtone'
  | 'refreshingWakeup'
  | 'smartphoneRingtone'
  | 'telephoneRingtone';

type SoundOption = {
  id: SoundId;
  label: string;
  previewable: boolean;
};

// ファイル名は app.json の expo-notifications.sounds に登録したものと一致させる
export const SOUND_CATALOG: Record<Exclude<SoundId, 'default'>, string> = {
  ding: 'ding.wav',
  phoneRingtone: 'phone_ringtone.wav',
  refreshingWakeup: 'refreshing_wakeup.wav',
  smartphoneRingtone: 'smartphone_ringtone.wav',
  telephoneRingtone: 'telephone_ringtone.wav',
};

// プレビュー用のローカルアセット。default は OS 依存なため null。
export const SOUND_PREVIEW_ASSETS: Partial<Record<SoundId, number>> = {
  ding: require('../../assets/sounds/ding.wav'),
  phoneRingtone: require('../../assets/sounds/phone_ringtone.wav'),
  refreshingWakeup: require('../../assets/sounds/refreshing_wakeup.wav'),
  smartphoneRingtone: require('../../assets/sounds/smartphone_ringtone.wav'),
  telephoneRingtone: require('../../assets/sounds/telephone_ringtone.wav'),
};

// iOS: NotificationContent.sound へ渡す値を解決
// 既定音は 'default'、カスタムは「ファイル名だけ」（パスなし）
export const resolveIosSound = (id?: SoundId): string => {
  if (!id || id === 'default') return 'default';
  return SOUND_CATALOG[id];
};

// UI用の選択肢（プレビュー可否も保持）
export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'default', label: 'デフォルト', previewable: false },
  { id: 'ding', label: 'ディング', previewable: true },
  { id: 'phoneRingtone', label: 'クラシックベル', previewable: true },
  { id: 'smartphoneRingtone', label: 'スマホ着信', previewable: true },
  { id: 'telephoneRingtone', label: '黒電話', previewable: true },
  { id: 'refreshingWakeup', label: 'さわやか', previewable: true },
];
