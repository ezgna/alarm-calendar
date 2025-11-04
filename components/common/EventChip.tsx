import { Text, TouchableOpacity, View } from 'react-native';
import { COLOR_BY_ID, DEFAULT_COLOR_ID } from '../../features/events/colors';

type Props = {
  title: string;
  colorId?: string;
  onPress?: () => void;
};

// 週/日タイムラインで使う小さなチップ
export default function EventChip({ title, colorId = DEFAULT_COLOR_ID, onPress }: Props) {
  const c = COLOR_BY_ID[colorId] ?? COLOR_BY_ID[DEFAULT_COLOR_ID];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className={`px-2 py-1 rounded-md ${c.classes.bg} ${c.classes.text}`}>
      <Text className="text-xs font-semibold" numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

