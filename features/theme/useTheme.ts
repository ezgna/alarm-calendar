// 現在のフレーバーに対応するトークンを取得するフック

import { THEME_CLASS_TOKENS, THEME_HEX_TOKENS } from './tokens';
import { useThemeStore } from './store';

export function useThemeTokens() {
  const flavor = useThemeStore((s) => s.flavor);
  const setFlavor = useThemeStore((s) => s.setFlavor);
  const t = THEME_CLASS_TOKENS[flavor];
  const h = THEME_HEX_TOKENS[flavor];
  return { flavor, setFlavor, t, h };
}

