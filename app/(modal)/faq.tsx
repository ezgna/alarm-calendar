import { router } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { useThemeTokens } from "../../features/theme/useTheme";

const MOCK_FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Q. 通知アラームが途中で途切れてしまう",
    answer:
      "A. iPhone では、画面上に出る「バナー通知」は数秒で自動的に消えるようになっており、そのタイミングで通知音も止まります。\n以下の方法で、通知が自動的に消えないように設定することができます。\n\n1. 「設定」アプリを開く\n2. 「通知」→「神アラーム」をタップ\n3. 「バナーのスタイル」で「持続的」を選ぶ",
  },
  {
    question: "Q. 音が小さい",
    answer:
      "A. より大きな音で鳴らしたい場合は、次の設定を確認してください。\n\n1. 「設定」アプリを開く\n2. 「サウンドと触覚」をタップ\n3. 「着信音と通知音」のスライダーを右側に動かして、通知音量を上げる",
  },
];

export default function FaqScreen() {
  const { t } = useThemeTokens();

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <ScrollView contentContainerClassName="px-4 py-6 pb-32">
        <View style={{ gap: 16 }}>
          <Text className={`text-lg font-semibold ${t.text}`}>FAQ</Text>
          <View style={{ gap: 32 }}>
            {MOCK_FAQ_ITEMS.map((item, idx) => (
              <View key={idx} style={{ gap: 4 }}>
                <Text className={`font-semibold ${t.text}`}>{item.question}</Text>
                <Text className={`${t.text} text-sm`}>{item.answer}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="pt-10">
          <Button title="閉じる" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </View>
  );
}
