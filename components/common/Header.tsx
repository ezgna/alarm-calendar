import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemeTokens } from '../../features/theme/useTheme';

type Props = {
  title: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onAdd?: () => void;
};

export default function Header({ title, onPrev, onNext, onToday, onAdd }: Props) {
  const { t } = useThemeTokens();
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 border-b ${t.surfaceBg} ${t.headerBorder}`}>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={onPrev} accessibilityRole="button" accessibilityLabel="前へ" style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
          <Ionicons name="chevron-back" size={18} color="#2563eb" />
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${t.text}`}>{title}</Text>
        <TouchableOpacity onPress={onNext} accessibilityRole="button" accessibilityLabel="次へ" style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
          <Ionicons name="chevron-forward" size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity className={`px-3 py-1 rounded-md ${t.buttonNeutralBg}`} onPress={onToday} accessibilityRole="button">
          <Text className={`${t.buttonNeutralText}`}>今日</Text>
        </TouchableOpacity>
        <TouchableOpacity className={`px-3 py-1 rounded-md ${t.buttonPrimaryBg}`} onPress={onAdd} accessibilityRole="button">
          <Text className={`${t.buttonPrimaryText}`}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
