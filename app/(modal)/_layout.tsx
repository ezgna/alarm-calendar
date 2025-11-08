import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal" }}>
      <Stack.Screen name="event-editor" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerTitle: "設定" }} />
    </Stack>
  );
}
