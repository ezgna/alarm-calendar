import { View } from 'react-native';
import { useCallback } from 'react';
import Header from '../../components/common/Header';
import { useCalendarStore } from '../../features/calendar/store';
import PagedView from '../../components/common/PagedView';
import { router } from 'expo-router';
import WeekTimeline from '../../components/calendar/WeekTimeline';
import { useFocusEffect } from '@react-navigation/native';

function formatWeekTitle(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年 ${m}月 ${d}日 週`;
}

export default function Week() {
  const iso = useCalendarStore((s) => s.currentDate);
  const page = useCalendarStore((s) => s.page);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);
  const date = new Date(iso);

  useFocusEffect(
    useCallback(() => {
      setView('week');
    }, [setView])
  );

  return (
    <View className="flex-1 bg-white">
      <Header
        title={formatWeekTitle(date)}
        onPrev={() => page(-1)}
        onNext={() => page(1)}
        onToday={() => goToday()}
        onAdd={() => router.push({ pathname: '/(modal)/event-editor', params: { date: new Date().toISOString() } })}
      />
      <PagedView onPage={(d) => page(d)}>
        <WeekTimeline />
      </PagedView>
    </View>
  );
}
