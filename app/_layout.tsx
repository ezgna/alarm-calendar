import { Stack } from "expo-router";
import "../global.css"
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useEventStore } from '../features/events/store';
import { currentTimeZone } from '../lib/date';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const rebuildIndex = useEventStore((s) => s.rebuildIndex);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        try {
          rebuildIndex(currentTimeZone());
        } catch {}
      }
    });
    return () => sub.remove();
  }, [rebuildIndex]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(modal)" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
