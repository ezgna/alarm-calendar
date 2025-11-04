import { View } from 'react-native';
import { useEffect } from 'react';
import Header from '../../components/common/Header';
import { useCalendarStore } from '../../features/calendar/store';
import PagedView from '../../components/common/PagedView';
import { router } from 'expo-router';
import DayTimeline from '../../components/calendar/DayTimeline';

function formatDayTitle(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年 ${m}月 ${d}日`;
}

export default function Day() {
  const iso = useCalendarStore((s) => s.currentDate);
  const page = useCalendarStore((s) => s.page);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);
  const date = new Date(iso);

  useEffect(() => {
    setView('day');
  }, [setView]);

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
