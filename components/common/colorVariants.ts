// NativeWind の className をリテラルで保持するカラー・バリアント定義

// 新しいカテゴリ色（6色）
export type ColorId = 'pink' | 'orange' | 'cream' | 'blue' | 'green' | 'yellow';

// 既定色はブルー系
export const DEFAULT_COLOR_ID: ColorId = 'blue';

// 画面表示用の短い日本語ラベル
export const COLOR_LABELS: Record<ColorId, string> = {
  pink: 'ピンク',
  orange: 'オレンジ',
  cream: 'クリーム',
  blue: 'ブルー',
  green: 'グリーン',
  yellow: 'イエロー',
};

// Tailwind 任意値クラス（bg-[#HEX] など）をリテラルで列挙し、パージ対象に検出させる
export const COLOR_VARIANTS: Record<
  ColorId,
  { bg: string; text: string; border?: string; dot: string }
> = {
  pink: { bg: 'bg-[#E1B7CF]', text: 'text-black', border: 'border-[#E1B7CF]', dot: 'bg-[#E1B7CF]' },
  orange: { bg: 'bg-[#F4CFA9]', text: 'text-black', border: 'border-[#F4CFA9]', dot: 'bg-[#F4CFA9]' },
  cream: { bg: 'bg-[#F9ECE3]', text: 'text-black', border: 'border-[#F9ECE3]', dot: 'bg-[#F9ECE3]' },
  blue: { bg: 'bg-[#9DC1D7]', text: 'text-black', border: 'border-[#9DC1D7]', dot: 'bg-[#9DC1D7]' },
  green: { bg: 'bg-[#C4D69E]', text: 'text-black', border: 'border-[#C4D69E]', dot: 'bg-[#C4D69E]' },
  yellow: { bg: 'bg-[#F3E8B2]', text: 'text-black', border: 'border-[#F3E8B2]', dot: 'bg-[#F3E8B2]' },
};

const LEGACY_COLOR_MAP: Record<string, ColorId> = {
  roseGray: 'pink',
  blush: 'orange',
  wisteria: 'cream',
  purple: 'cream',
  blueGray: 'blue',
  sage: 'green',
  almond: 'yellow',
};

function resolveColorId(id?: string): ColorId {
  const key = id as ColorId | undefined;
  if (key && COLOR_VARIANTS[key]) return key;
  if (id && LEGACY_COLOR_MAP[id]) return LEGACY_COLOR_MAP[id];
  return DEFAULT_COLOR_ID;
}

export function getColorClasses(id?: string) {
  const key = resolveColorId(id);
  return COLOR_VARIANTS[key];
}

// Picker 表示順
export const COLOR_IDS: ColorId[] = ['pink', 'orange', 'cream', 'blue', 'green', 'yellow'];

// style 用の HEX 値（テキストは全色黒）
export type ColorHex = { bg: string; text: string; border: string };

export const COLOR_HEX: Record<ColorId, ColorHex> = {
  pink: { bg: '#E1B7CF', text: '#000000', border: '#E1B7CF' },
  orange: { bg: '#F4CFA9', text: '#000000', border: '#F4CFA9' },
  cream: { bg: '#F9ECE3', text: '#000000', border: '#F9ECE3' },
  blue: { bg: '#9DC1D7', text: '#000000', border: '#9DC1D7' },
  green: { bg: '#C4D69E', text: '#000000', border: '#C4D69E' },
  yellow: { bg: '#F3E8B2', text: '#000000', border: '#F3E8B2' },
};

export function getColorHex(id?: string): ColorHex {
  const key = resolveColorId(id);
  return COLOR_HEX[key];
}
