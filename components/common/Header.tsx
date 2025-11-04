import { View, Text, TouchableOpacity } from 'react-native';
import { useCalendarStore } from '../../features/calendar/store';

type Props = {
  title: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onAdd?: () => void;
};

export default function Header({ title, onPrev, onNext, onToday, onAdd }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={onPrev} accessibilityRole="button">
          <Text className="text-blue-600 text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{title}</Text>
        <TouchableOpacity onPress={onNext} accessibilityRole="button">
          <Text className="text-blue-600 text-lg">›</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="px-3 py-1 rounded-md bg-neutral-100" onPress={onToday} accessibilityRole="button">
          <Text className="text-neutral-900">今日</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-3 py-1 rounded-md bg-blue-600" onPress={onAdd} accessibilityRole="button">
          <Text className="text-white">＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

