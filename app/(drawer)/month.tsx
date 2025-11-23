import { View } from 'react-native';
import { useCallback, useState } from 'react';
import Header from '../../components/common/Header';
import MonthGrid from '../../components/calendar/MonthGrid';
import { useCalendarStore } from '../../features/calendar/store';
import PagedView from '../../components/common/PagedView';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeTokens } from '../../features/theme/useTheme';
import DaySheet from '../../components/sheet/DaySheet';

function formatTitle(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

export default function Month() {
  const { t } = useThemeTokens();
  const currentIso = useCalendarStore((s) => s.currentDate);
  const page = useCalendarStore((s) => s.page);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);
  const date = new Date(currentIso);
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setView('month');
    }, [setView])
  );

  const handleSelectDate = useCallback((d: Date) => {
    setActiveDate(d);
    setSheetVisible(true);
  }, []);

  const handleRequestClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  // スワイプで閉じる際、アニメ完了前にコンテンツが消えるとクラッシュしやすいので遅延でクリアする
  const handleSheetClosed = useCallback(() => {
    setTimeout(() => setActiveDate(null), 50);
  }, []);

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <Header
        title={formatTitle(date)}
        onPrev={() => page(-1)}
        onNext={() => page(1)}
        onToday={() => goToday()}
        onAdd={() => router.push({ pathname: '/(modal)/event-editor', params: { date: new Date().toISOString() } })}
      />
      <PagedView onPage={(d) => page(d)}>
        <MonthGrid onSelectDate={handleSelectDate} isSheetOpen={sheetVisible} />
      </PagedView>
      <DaySheet visible={sheetVisible} date={activeDate} onRequestClose={handleRequestClose} onClosed={handleSheetClosed} />
    </View>
  );
}
