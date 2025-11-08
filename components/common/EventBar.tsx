import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import { DEFAULT_COLOR_ID, getColorHex } from './colorVariants';

type Props = {
  title: string;
  colorId?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

// 終了時刻を持つイベント用のバー表示。
// 親コンテナの高さにフィットさせる前提で、height: '100%' を指定。
export default function EventBar({ title, colorId = DEFAULT_COLOR_ID, onPress, style }: Props) {
  const hex = getColorHex(colorId);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        height: '100%',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: hex.bg,
        // 枠線は使用しない
        ...style,
      }}
    >
      <Text style={{ color: hex.text, fontWeight: '600' }} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
