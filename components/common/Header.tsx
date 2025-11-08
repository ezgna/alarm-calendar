import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

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
        <TouchableOpacity onPress={onPrev} accessibilityRole="button" accessibilityLabel="前へ" style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
          <Ionicons name="chevron-back" size={18} color="#2563eb" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{title}</Text>
        <TouchableOpacity onPress={onNext} accessibilityRole="button" accessibilityLabel="次へ" style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
          <Ionicons name="chevron-forward" size={18} color="#2563eb" />
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
