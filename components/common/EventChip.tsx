import { Text, TouchableOpacity } from 'react-native';
import { DEFAULT_COLOR_ID, getColorClasses } from './colorVariants';

type Props = {
  title: string;
  colorId?: string;
  onPress?: () => void;
};

// 週/日タイムラインで使う小さなチップ
export default function EventChip({ title, colorId = DEFAULT_COLOR_ID, onPress }: Props) {
  const c = getColorClasses(colorId);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className={`px-2 py-1 rounded-md ${c.bg} ${c.text}`}>
      <Text className="text-xs font-semibold" numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
