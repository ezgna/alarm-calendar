export type SoundId =
  | 'default'
  | 'phoneRingtone'
  | 'smartphoneRingtone'
  | 'telephoneRingtone'
  | 'xylophone';

// 端末既定は使わず、アプリ内の ding_29s_fade.wav を「デフォルト音」として利用
export const DEFAULT_SOUND_FILENAME = 'ding_29s_fade.wav';

type SoundOption = {
  id: SoundId;
  label: string;
  previewable: boolean;
};

// ファイル名は app.json の expo-notifications.sounds に登録したものと一致させる
export const SOUND_CATALOG: Record<Exclude<SoundId, 'default'>, string> = {
  phoneRingtone: 'phone_ringtone_29s_fade.wav',
  smartphoneRingtone: 'smartphone_ringtone_29s_fade.wav',
  telephoneRingtone: 'telephone_ringtone_29s_fade.wav',
  xylophone: 'xylophone_29s_fade.wav',
};

// プレビュー用のローカルアセット。default も ding_29s_fade.wav を再生する。
export const SOUND_PREVIEW_ASSETS: Partial<Record<SoundId, number>> = {
  default: require('../../assets/sounds/ding_29s_fade.wav'),
  phoneRingtone: require('../../assets/sounds/phone_ringtone_29s_fade.wav'),
  smartphoneRingtone: require('../../assets/sounds/smartphone_ringtone_29s_fade.wav'),
  telephoneRingtone: require('../../assets/sounds/telephone_ringtone_29s_fade.wav'),
  xylophone: require('../../assets/sounds/xylophone_29s_fade.wav'),
};

// iOS: NotificationContent.sound へ渡す値を解決
// 既定音も ding.wav を使用（端末既定は使わない）。カスタムは「ファイル名だけ」（パスなし）
export const resolveIosSound = (id?: SoundId | string): string => {
  if (!id || id === 'default') return DEFAULT_SOUND_FILENAME;
  const resolved = SOUND_CATALOG[id as Exclude<SoundId, 'default'>];
  return resolved ?? DEFAULT_SOUND_FILENAME;
};

// UI用の選択肢（プレビュー可否も保持）
export const SOUND_OPTIONS: SoundOption[] = [
  // デフォルト=ding.wav を鳴らす（選択肢は残す）
  { id: 'default', label: 'デフォルト', previewable: true },
  { id: 'phoneRingtone', label: '黒電話', previewable: true },
  { id: 'smartphoneRingtone', label: '波', previewable: true },
  { id: 'telephoneRingtone', label: '着信音', previewable: true },
  { id: 'xylophone', label: '木琴', previewable: true },
];
