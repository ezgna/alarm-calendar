import { View, Text, Button, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useThemeTokens } from "../../features/theme/useTheme";
import { useThemeStore } from "../../features/theme/store";

export default function Settings() {
  const { t } = useThemeTokens();
  const flavor = useThemeStore((s) => s.flavor);
  const setFlavor = useThemeStore((s) => s.setFlavor);
  return (
    <View style={{ flex: 1 }} className={`${t.surfaceBg}`}>
      <View style={{ padding: 16, gap: 16 }}>
        <Text className={`text-base font-semibold ${t.text}`}>設定</Text>

        <View style={{ gap: 8 }}>
          <Text className={`${t.textMuted}`}>テーマ</Text>
          <View className="flex-row gap-4">
            {([
              { key: 'simple', label: 'シンプル' },
              { key: 'mist', label: 'ミスト' },
              { key: 'rose', label: 'ローズ' },
            ] as const).map((opt) => {
              const active = flavor === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setFlavor(opt.key as any)}
                  className={`px-3 py-2 rounded-md border ${t.border} ${active ? t.buttonPrimaryBg : ''}`}
                >
                  <Text className={`${active ? t.buttonPrimaryText : t.text}`}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button title="閉じる" onPress={() => router.back()} />
      </View>
    </View>
  );
}
