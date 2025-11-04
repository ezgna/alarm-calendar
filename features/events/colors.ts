// カテゴリ色プリセット（classNameベースで定義）
// 保存は colorId のみ。UI で id -> classes に解決する。

export type ColorToken = {
  id: string;
  label: string;
  classes: {
    bg: string;
    text: string;
    border?: string;
    dot: string;
  };
};

export const COLORS: ColorToken[] = [
  {
    id: 'red',
    label: 'レッド',
    classes: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', dot: 'bg-red-500' },
  },
  {
    id: 'blue',
    label: 'ブルー',
    classes: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', dot: 'bg-blue-500' },
  },
  {
    id: 'green',
    label: 'グリーン',
    classes: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', dot: 'bg-green-500' },
  },
  {
    id: 'amber',
    label: 'アンバー',
    classes: { bg: 'bg-amber-500', text: 'text-black', border: 'border-amber-600', dot: 'bg-amber-500' },
  },
  {
    id: 'purple',
    label: 'パープル',
    classes: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600', dot: 'bg-purple-500' },
  },
  {
    id: 'teal',
    label: 'ティール',
    classes: { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600', dot: 'bg-teal-500' },
  },
];

export const COLOR_BY_ID: Record<string, ColorToken> = Object.fromEntries(
  COLORS.map((c) => [c.id, c])
);

// デフォルト色
export const DEFAULT_COLOR_ID = 'blue';

