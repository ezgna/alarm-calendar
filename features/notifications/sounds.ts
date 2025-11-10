export type SoundId =
  | 'default'
  | 'beep'
  | 'brightUpbeat'
  | 'classic'
  | 'magical'
  | 'refreshingWakeup';

// ファイル名は app.json の expo-notifications.sounds に登録したものと一致させる
export const SOUND_CATALOG: Record<Exclude<SoundId, 'default'>, string> = {
  beep: 'beep.wav',
  brightUpbeat: 'bright_upbeat.wav',
  classic: 'classic.wav',
  magical: 'magical.wav',
  refreshingWakeup: 'refreshing_wakeup.wav',
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
  { id: 'beep',             label: 'ビープ' },
  { id: 'brightUpbeat',     label: 'アップビート' },
  { id: 'classic',          label: 'クラシック' },
  { id: 'magical',          label: 'マジカル' },
  { id: 'refreshingWakeup', label: 'さわやか' },
];
