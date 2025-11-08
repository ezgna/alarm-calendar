// NativeWind の className をリテラルで保持するカラー・バリアント定義

export type ColorId = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal';

export const DEFAULT_COLOR_ID: ColorId = 'blue';

export const COLOR_LABELS: Record<ColorId, string> = {
  red: 'レッド',
  blue: 'ブルー',
  green: 'グリーン',
  amber: 'アンバー',
  purple: 'パープル',
  teal: 'ティール',
};

export const COLOR_VARIANTS: Record<
  ColorId,
  { bg: string; text: string; border?: string; dot: string }
> = {
  red: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', dot: 'bg-green-500' },
  amber: { bg: 'bg-amber-500', text: 'text-black', border: 'border-amber-600', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600', dot: 'bg-purple-500' },
  teal: { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600', dot: 'bg-teal-500' },
};

export function getColorClasses(id?: string) {
  const key = (id as ColorId) ?? DEFAULT_COLOR_ID;
  return COLOR_VARIANTS[key] ?? COLOR_VARIANTS[DEFAULT_COLOR_ID];
}

export const COLOR_IDS: ColorId[] = ['red', 'blue', 'green', 'amber', 'purple', 'teal'];

// style 用の HEX 値（Tailwind v3 相当の色）
export type ColorHex = { bg: string; text: string; border: string };

export const COLOR_HEX: Record<ColorId, ColorHex> = {
  red: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  blue: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
  green: { bg: '#22c55e', text: '#ffffff', border: '#16a34a' },
  amber: { bg: '#f59e0b', text: '#000000', border: '#d97706' },
  purple: { bg: '#a855f7', text: '#ffffff', border: '#9333ea' },
  teal: { bg: '#14b8a6', text: '#ffffff', border: '#0d9488' },
};

export function getColorHex(id?: string): ColorHex {
  const key = (id as ColorId) ?? DEFAULT_COLOR_ID;
  return COLOR_HEX[key] ?? COLOR_HEX[DEFAULT_COLOR_ID];
}
