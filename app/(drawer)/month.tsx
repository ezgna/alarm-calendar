import { View } from 'react-native';
import { useEffect } from 'react';
import Header from '../../components/common/Header';
import MonthGrid from '../../components/calendar/MonthGrid';
import { useCalendarStore } from '../../features/calendar/store';
import PagedView from '../../components/common/PagedView';
import { router } from 'expo-router';

function formatTitle(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

export default function Month() {
  const currentIso = useCalendarStore((s) => s.currentDate);
  const page = useCalendarStore((s) => s.page);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);
  const date = new Date(currentIso);

  useEffect(() => {
    setView('month');
  }, [setView]);

  return (
    <View className="flex-1 bg-white">
      <Header
        title={formatTitle(date)}
        onPrev={() => page(-1)}
        onNext={() => page(1)}
        onToday={() => goToday()}
        onAdd={() => router.push({ pathname: '/(modal)/event-editor', params: { date: new Date().toISOString() } })}
      />
      <PagedView onPage={(d) => page(d)}>
        <MonthGrid />
      </PagedView>
    </View>
  );
}
