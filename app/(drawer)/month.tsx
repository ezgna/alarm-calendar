import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View, useWindowDimensions } from "react-native";
import WeekRow, { WeekItem } from "../../components/calendar/WeekRow";
import Header from "../../components/common/Header";
import PlatformBannerAd from "../../components/common/PlatformBannerAd";
import DaySheet from "../../components/sheet/DaySheet";
import { useCalendarStore } from "../../features/calendar/store";
import { useThemeTokens } from "../../features/theme/useTheme";
import { addDays, addMonths, startOfMonth, startOfWeek } from "../../lib/date";

const MONTH_SPAN = 12; // 前後に用意する月バッファを縮小して初期レンダリング負荷を低減
const DAY_CELL_HEIGHT = 102; // 日セル縦幅：ここを変えれば高さを調整可能

function formatTitle(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const monthKey = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;

export default function Month() {
  const { t } = useThemeTokens();
  const { width } = useWindowDimensions();

  const currentIso = useCalendarStore((s) => s.currentDate);
  const setDate = useCalendarStore((s) => s.setDate);
  const goToday = useCalendarStore((s) => s.goToday);
  const setView = useCalendarStore((s) => s.setView);

  const anchorDate = useMemo(() => startOfMonth(new Date()), []);
  const currentDate = useMemo(() => startOfMonth(new Date(currentIso)), [currentIso]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(currentDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const listRef = useRef<FlatList<WeekItem>>(null);
  const currentIndexRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      setView("month");
    }, [setView])
  );

  const cellSize = useMemo(() => Math.floor(width / 7), [width]); // 横幅は画面幅を7等分
  const cellHeight = useMemo(() => Math.max(DAY_CELL_HEIGHT, cellSize), [cellSize]);
  const itemHeight = cellHeight; // 1週=1行

  // 週データ生成（空白セルなし連続日）
  const { weeks, monthStartIndex, initialIndex } = useMemo(() => {
    const start = startOfWeek(addMonths(anchorDate, -MONTH_SPAN), 0);
    const endMonth = addMonths(anchorDate, MONTH_SPAN + 1);
    const end = startOfWeek(endMonth, 0);

    const weeks: WeekItem[] = [];
    const monthStartIndex: Record<string, number> = {};
    let cursor = start;
    while (cursor < end) {
      const days = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
      const rep = days[3]; // 週の真ん中を代表月に使用
      const labelMonthDay = days.find((d) => d.getDate() === 1);
      const stripeIndex = ((rep.getFullYear() - anchorDate.getFullYear()) * 12 + (rep.getMonth() - anchorDate.getMonth())) % 2;
      // 事前計算: 日毎のイベントキーだけ持たせる（実データは WeekRow で store から参照）
      const dayKeys = days.map((d) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`);
      weeks.push({ start: cursor, days, repMonth: rep, stripeIndex, dayKeys });

      if (labelMonthDay) {
        const key = monthKey(labelMonthDay);
        if (monthStartIndex[key] === undefined) monthStartIndex[key] = weeks.length - 1;
      }

      cursor = addDays(cursor, 7);
    }

    const currentIdx = weeks.findIndex((w) => currentDate >= w.start && currentDate < addDays(w.start, 7));
    return { weeks, monthStartIndex, initialIndex: currentIdx >= 0 ? currentIdx : 0 };
  }, [anchorDate, currentDate]);

  // 初期インデックスを同期
  useEffect(() => {
    currentIndexRef.current = initialIndex;
    const initialMonth = weeks[initialIndex]?.repMonth ?? currentDate;
    setVisibleMonth(startOfMonth(initialMonth));
    setDate(startOfMonth(initialMonth));
  }, [initialIndex, weeks, setDate, currentDate]);

  const handleSelectDate = useCallback((d: Date) => {
    setSelectedDate(d);
    setSheetVisible(true);
  }, []);

  const handleRequestClose = useCallback(() => setSheetVisible(false), []);

  // スワイプ閉じのタイミングでクラッシュしないよう少し待って state をクリア
  const handleSheetClosed = useCallback(() => {
    setTimeout(() => setSelectedDate(null), 50);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = clamp(index, 0, weeks.length - 1);
      currentIndexRef.current = clamped;
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [weeks.length]
  );

  const jumpToMonth = useCallback(
    (base: Date, deltaMonths: number) => {
      const target = startOfMonth(addMonths(base, deltaMonths));
      const key = monthKey(target);
      const idx = monthStartIndex[key];
      if (idx !== undefined) {
        scrollToIndex(idx);
        setVisibleMonth(target);
        setDate(target);
      }
    },
    [monthStartIndex, scrollToIndex, setDate]
  );

  const handlePrev = useCallback(() => jumpToMonth(visibleMonth, -1), [jumpToMonth, visibleMonth]);
  const handleNext = useCallback(() => jumpToMonth(visibleMonth, 1), [jumpToMonth, visibleMonth]);

  const handleToday = useCallback(() => {
    const todayMonth = startOfMonth(new Date());
    const key = monthKey(todayMonth);
    const idx = monthStartIndex[key] ?? 0;
    scrollToIndex(idx);
    goToday();
    setVisibleMonth(todayMonth);
  }, [scrollToIndex, goToday, monthStartIndex]);

  // 画面中央付近の週をもとに月を決定（スクロール停止時のみ計算）
  const updateMonthByOffset = useCallback(
    (offsetY: number, viewportH: number) => {
      const mid = offsetY + viewportH / 2;
      const idx = clamp(Math.round(mid / itemHeight), 0, weeks.length - 1);
      const week = weeks[idx];
      if (!week) return;
      const monthDate = startOfMonth(week.repMonth);
      if (monthDate.getTime() === visibleMonth.getTime()) return; // 変化なしならスキップ
      currentIndexRef.current = idx;
      setVisibleMonth(monthDate);
      setDate(monthDate);
    },
    [itemHeight, weeks, visibleMonth, setDate]
  );

  const renderItem = useCallback(
    ({ item }: { item: WeekItem }) => {
      return (
        <View style={{ height: itemHeight }}>
          <WeekRow
            days={item.days}
            repMonth={item.repMonth}
            stripeIndex={item.stripeIndex}
            dayKeys={item.dayKeys}
            cellSize={cellSize}
            cellHeight={cellHeight}
            onSelectDate={handleSelectDate}
          />
        </View>
      );
    },
    [cellSize, cellHeight, handleSelectDate, itemHeight]
  );

  const keyExtractor = useCallback((item: WeekItem) => item.start.toISOString(), []);

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <Header
        title={formatTitle(visibleMonth)}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onAdd={() => router.push({ pathname: "/(modal)/event-editor", params: { date: new Date().toISOString() } })}
      />

      <WeekdayHeader />

      <FlatList
        ref={listRef}
        data={weeks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        // スクロール停止時に月を判定（中央の週を採用）
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => updateMonthByOffset(e.nativeEvent.contentOffset.y, e.nativeEvent.layoutMeasurement.height)}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => updateMonthByOffset(e.nativeEvent.contentOffset.y, e.nativeEvent.layoutMeasurement.height)}
        initialNumToRender={8}
        windowSize={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: sheetVisible ? 240 : 120 }}
        ListFooterComponent={<View className="py-4"><PlatformBannerAd /></View>}
        onScrollToIndexFailed={(info) => {
          const fallback = itemHeight * info.index;
          listRef.current?.scrollToOffset({ offset: fallback, animated: true });
        }}
      />

      <DaySheet
        visible={sheetVisible}
        date={selectedDate}
        onRequestClose={handleRequestClose}
        onClosed={handleSheetClosed}
      />
    </View>
  );
}

function WeekdayHeader() {
  const { t } = useThemeTokens();
  return (
    <View className={`flex-row border-b ${t.headerBorder} ${t.weekdayBg}`} style={{ height: 28, alignItems: "center" }}>
      {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
        <View key={w} className="flex-1 items-center">
          <Text className={`text-xs text-white`}>{w}</Text>
        </View>
      ))}
    </View>
  );
}
