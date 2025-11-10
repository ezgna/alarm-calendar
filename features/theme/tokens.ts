// テーマのセマンティック・トークン定義（ライト限定）
// 注意: 動的クラス生成はせず、ここでリテラル列挙して NativeWind/Tailwind に検出させる

export type Flavor = 'simple' | 'mist' | 'rose';

export type ThemeClassTokens = {
  // ベース
  appBg: string; // 画面ルート背景
  surfaceBg: string; // セル/カード等の面
  weekdayBg: string; // 曜日行など“帯”の背景（ややくすみ）
  text: string; // 主要テキスト
  textMuted: string; // 補助テキスト
  border: string; // 枠線
  divider: string; // 罫線

  // ヘッダー
  headerBg: string;
  headerBorder: string;
  timeText: string; // 時刻ラベル等

  // ボタン
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonNeutralBg: string;
  buttonNeutralText: string;
  dangerBg: string;
  dangerText: string;

  // バッジ等
  badgeTodayBg: string;
  badgeTodayText: string;
};

export type ThemeHexTokens = {
  appBg?: string;
  divider?: string;
};

export const THEME_CLASS_TOKENS: Record<Flavor, ThemeClassTokens> = {
  // ニュートラル基調
  simple: {
    appBg: 'bg-white',
    surfaceBg: 'bg-neutral-50',
    weekdayBg: 'bg-neutral-100',
    text: 'text-neutral-900',
    textMuted: 'text-neutral-600',
    border: 'border-neutral-200',
    divider: 'bg-neutral-200',

    headerBg: 'bg-white',
    headerBorder: 'border-neutral-200',
    timeText: 'text-neutral-500',

    buttonPrimaryBg: 'bg-blue-600',
    buttonPrimaryText: 'text-white',
    buttonNeutralBg: 'bg-neutral-100',
    buttonNeutralText: 'text-neutral-900',
    dangerBg: 'bg-red-600',
    dangerText: 'text-white',

    badgeTodayBg: 'bg-blue-600',
    badgeTodayText: 'text-white',
  },

  mist: {
    appBg: 'bg-white',
    surfaceBg: 'bg-[#f5f9f9]',
    weekdayBg: 'bg-[#9CA99E]',
    // weekdayBg: 'bg-[#dbe6e6]',
    text: 'text-neutral-900',
    textMuted: 'text-neutral-600',
    border: 'border-[#c7d7d7]',
    divider: 'bg-[#c7d7d7]',

    headerBg: 'bg-[#e0ecec]',
    headerBorder: 'border-[#c7d7d7]',
    timeText: 'text-neutral-600',

    buttonPrimaryBg: 'bg-[#9CA99E]',
    // buttonPrimaryBg: 'bg-teal-600',
    buttonPrimaryText: 'text-white',
    buttonNeutralBg: 'bg-[#d5e3e3]',
    buttonNeutralText: 'text-neutral-900',
    dangerBg: 'bg-red-600',
    dangerText: 'text-white',

    badgeTodayBg: 'bg-teal-600',
    badgeTodayText: 'text-white',
  },

  // ピンク系
  rose: {
    appBg: 'bg-white',
    surfaceBg: 'bg-[#fffafb]',
    weekdayBg: 'bg-[#D3A6A1]',
    // weekdayBg: 'bg-rose-100',
    text: 'text-rose-950',
    textMuted: 'text-rose-700',
    border: 'border-rose-200',
    divider: 'bg-rose-200',

    headerBg: 'bg-rose-50',
    headerBorder: 'border-rose-200',
    timeText: 'text-rose-600',

    buttonPrimaryBg: 'bg-[#D2A7B3]',
    // buttonPrimaryBg: 'bg-rose-500',
    buttonPrimaryText: 'text-white',
    buttonNeutralBg: 'bg-rose-100',
    buttonNeutralText: 'text-rose-900',
    dangerBg: 'bg-red-600',
    dangerText: 'text-white',

    badgeTodayBg: 'bg-rose-500',
    badgeTodayText: 'text-white',
  },
};

export const THEME_HEX_TOKENS: Record<Flavor, ThemeHexTokens> = {
  simple: { appBg: '#ffffff', divider: '#e5e7eb' },
  mist: { appBg: '#f4f7f7', divider: '#c7d7d7' },
  rose: { appBg: '#fff6f7', divider: '#fecdd3' },
};
