import { View, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import Header from '../../components/common/Header';
import { useCalendarStore } from '../../features/calendar/store';
import PagedView from '../../components/common/PagedView';
import { router, useLocalSearchParams } from 'expo-router';
import DayTimeline from '../../components/calendar/DayTimeline';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

function formatDayTitle(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年 ${m}月 ${d}日`;
}

export default function Day() {
  // 月カレンダーから来たかどうかの判定（origin=month）
  const params = useLocalSearchParams<{ origin?: string }>();
  const fromMonth = params.origin === 'month';
  const navigation = useNavigation<any>();

  const iso = useCalendarStore((s) => s.currentDate);
  const page = useCalendarStore((s) => s.page);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);
  const date = new Date(iso);

  useEffect(() => {
    setView('day');
  }, [setView]);

  // Drawer の既定ヘッダー左を、月から来た場合のみ「月へ戻る」ボタンに差し替える
  useEffect(() => {
    if (fromMonth) {
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="月に戻る"
            onPress={() => {
              // 履歴がある前提なので back。万一の不整合時は置き換えで月へ。
              try {
                router.back();
              } catch {
                router.replace('/(drawer)/month');
              }
            }}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color="#2563eb" />
          </TouchableOpacity>
        ),
      });
    } else {
      // それ以外の経路では、既定（ハンバーガー）に戻す
      navigation.setOptions({ headerLeft: undefined });
    }
  }, [navigation, fromMonth]);

  return (
    <View className="flex-1 bg-white">
      <Header
        title={formatDayTitle(date)}
        onPrev={() => page(-1)}
        onNext={() => page(1)}
        onToday={() => goToday()}
        onAdd={() => router.push({ pathname: '/(modal)/event-editor', params: { date: new Date().toISOString() } })}
      />
      <PagedView onPage={(d) => page(d)}>
        <DayTimeline />
      </PagedView>
    </View>
  );
}
