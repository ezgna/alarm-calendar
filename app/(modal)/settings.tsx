import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Settings() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text>設定</Text>
      <Button title="閉じる" onPress={() => router.back()} />
    </View>
  );
}
