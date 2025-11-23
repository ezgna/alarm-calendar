// アラームパターン（A〜F）に対応する色定義
// 既存のカテゴリ色6色に揃え、背景は薄いティント、枠は少し濃いティントを付与する

import type { PatternKey } from './store';
import type { ColorId } from '@/components/common/colorVariants';

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

// 視認性が悪い色に対して境界線を濃くするオーバーライド
const BORDER_OVERRIDE: Partial<Record<PatternKey, string>> = {
  C: '#D6C4B1', // クリーム用に少し濃い枠色を指定
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

function relativeLuminance(hex: string) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getPatternTint(key: PatternKey): PatternTint | null {
  const hex = BASE_HEX[key];
  if (!hex) {
    // default はニュートラルな色を返す
    return { bg: NEUTRAL_BG, border: NEUTRAL_BORDER, dot: NEUTRAL_DOT };
  }

  const lum = relativeLuminance(hex);
  // 明るい色（例: C=クリーム）は境界が見えにくいので濃いめにする
  const borderAlpha = lum > 0.7 ? 0.7 : 0.42;
  const bgAlpha = lum > 0.7 ? 0.26 : 0.16;
  const borderColor = BORDER_OVERRIDE[key] ?? toRgba(hex, borderAlpha);

  return {
    bg: toRgba(hex, bgAlpha),
    border: borderColor,
    dot: hex,
  };
}

export function getPatternDot(key: PatternKey): string {
  return getPatternTint(key)?.dot ?? NEUTRAL_DOT;
}

// パターン色に対し、視認性の高いテキスト色を返す（明るい色はダークテキストにフォールバック）
export function getPatternTextColor(key: PatternKey): string {
  const dot = getPatternDot(key);
  const lum = relativeLuminance(dot);
  // 明度が高い（例: カスタム3のクリーム）場合は濃いテキストにする
  if (lum > 0.7) return '#0f172a';
  return dot;
}

// パターンキーをカテゴリ色IDにマッピング（新規予定作成時の色自動適用に使用）
export function patternKeyToColorId(key: PatternKey): ColorId {
  switch (key) {
    case 'A':
      return 'pink';
    case 'B':
      return 'orange';
    case 'C':
      return 'cream';
    case 'D':
      return 'blue';
    case 'E':
      return 'green';
    case 'F':
      return 'yellow';
    case 'default':
    default:
      return 'green';
  }
}
