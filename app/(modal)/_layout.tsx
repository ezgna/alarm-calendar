import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal" }}>
      {/* タイトルは画面側で動的に設定する */}
      <Stack.Screen name="event-editor" />
      <Stack.Screen name="settings" options={{ headerTitle: "設定" }} />
      <Stack.Screen name="faq" options={{ headerTitle: "FAQ" }} />
    </Stack>
  );
}
