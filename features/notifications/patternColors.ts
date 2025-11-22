// アラームパターン（A〜F）に対応する色定義
// 既存のカテゴリ色6色に揃え、背景は薄いティント、枠は少し濃いティントを付与する

import type { PatternKey } from './store';

type PatternTint = {
  bg: string;
  border: string;
  dot: string;
};

const BASE_HEX: Partial<Record<PatternKey, string>> = {
  A: '#E1B7CF', // ピンク
  B: '#F4CFA9', // オレンジ
  C: '#F9ECE3', // クリーム
  D: '#9DC1D7', // ブルー
  E: '#C4D69E', // グリーン
  F: '#F3E8B2', // イエロー
};

const NEUTRAL_DOT = '#9ca3af'; // default 用の控えめなグレー
const NEUTRAL_BORDER = 'rgba(156, 163, 175, 0.42)'; // default 用の控えめな枠
const NEUTRAL_BG = 'rgba(156, 163, 175, 0.10)'; // default 用の薄い背景

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getPatternTint(key: PatternKey): PatternTint | null {
  const hex = BASE_HEX[key];
  if (!hex) {
    // default はニュートラルな色を返す
    return { bg: NEUTRAL_BG, border: NEUTRAL_BORDER, dot: NEUTRAL_DOT };
  }
  return {
    bg: toRgba(hex, 0.16),
    border: toRgba(hex, 0.42),
    dot: hex,
  };
}

export function getPatternDot(key: PatternKey): string {
  return getPatternTint(key)?.dot ?? NEUTRAL_DOT;
}
