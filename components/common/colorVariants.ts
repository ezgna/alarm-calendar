// NativeWind の className をリテラルで保持するカラー・バリアント定義

// 新しいカテゴリ色（6色）
export type ColorId = 'roseGray' | 'blush' | 'wisteria' | 'blueGray' | 'sage' | 'almond';

// 既定色はブルーグレー
export const DEFAULT_COLOR_ID: ColorId = 'blueGray';

// 画面表示用の短い日本語ラベル
export const COLOR_LABELS: Record<ColorId, string> = {
  roseGray: 'ローズグレー',
  blush: 'ブラッシュ',
  wisteria: 'ライラック',
  blueGray: 'ブルーグレー',
  sage: 'セージ',
  almond: 'アーモンド',
};

// Tailwind 任意値クラス（bg-[#HEX] など）をリテラルで列挙し、パージ対象に検出させる
export const COLOR_VARIANTS: Record<
  ColorId,
  { bg: string; text: string; border?: string; dot: string }
> = {
  roseGray: { bg: 'bg-[#C19F9F]', text: 'text-black', border: 'border-[#B59292]', dot: 'bg-[#C19F9F]' },
  blush: { bg: 'bg-[#E8B4B4]', text: 'text-black', border: 'border-[#D09D9D]', dot: 'bg-[#E8B4B4]' },
  wisteria: { bg: 'bg-[#A58FAB]', text: 'text-black', border: 'border-[#927A98]', dot: 'bg-[#A58FAB]' },
  blueGray: { bg: 'bg-[#778899]', text: 'text-black', border: 'border-[#6B7A89]', dot: 'bg-[#778899]' },
  sage: { bg: 'bg-[#A9BA8E]', text: 'text-black', border: 'border-[#94A677]', dot: 'bg-[#A9BA8E]' },
  almond: { bg: 'bg-[#D2BA89]', text: 'text-black', border: 'border-[#C0A873]', dot: 'bg-[#D2BA89]' },
};

export function getColorClasses(id?: string) {
  const key = (id as ColorId) ?? DEFAULT_COLOR_ID;
  return COLOR_VARIANTS[key] ?? COLOR_VARIANTS[DEFAULT_COLOR_ID];
}

// Picker 表示順
export const COLOR_IDS: ColorId[] = ['roseGray', 'blush', 'wisteria', 'blueGray', 'sage', 'almond'];

// style 用の HEX 値（テキストは全色黒）
export type ColorHex = { bg: string; text: string; border: string };

export const COLOR_HEX: Record<ColorId, ColorHex> = {
  roseGray: { bg: '#C19F9F', text: '#000000', border: '#B59292' },
  blush: { bg: '#E8B4B4', text: '#000000', border: '#D09D9D' },
  wisteria: { bg: '#A58FAB', text: '#000000', border: '#927A98' },
  blueGray: { bg: '#778899', text: '#000000', border: '#6B7A89' },
  sage: { bg: '#A9BA8E', text: '#000000', border: '#94A677' },
  almond: { bg: '#D2BA89', text: '#000000', border: '#C0A873' },
};

export function getColorHex(id?: string): ColorHex {
  const key = (id as ColorId) ?? DEFAULT_COLOR_ID;
  return COLOR_HEX[key] ?? COLOR_HEX[DEFAULT_COLOR_ID];
}
