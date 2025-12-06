import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View, useWindowDimensions } from "react-native";
import MonthWeekRow, { MonthWeekItem } from "../../components/calendar/MonthWeekRow";
import Header from "../../components/common/Header";
import PlatformBannerAd from "../../components/common/PlatformBannerAd";
import DaySheet from "../../components/sheet/DaySheet";
import { useCalendarStore } from "../../features/calendar/store";
import { useThemeTokens } from "../../features/theme/useTheme";
import { addDays, addMonths, startOfMonth, startOfWeek } from "../../lib/date";

// 表示範囲: 過去1年 / 未来20年ぶんを用意して、初期レンダリング負荷を抑えつつ十分なスクロール幅を確保
const PAST_MONTH_SPAN = 12; // 過去12ヶ月
const FUTURE_MONTH_SPAN = 240; // 未来240ヶ月（20年）
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

  const listRef = useRef<FlatList<MonthWeekItem>>(null);
  const currentIndexRef = useRef<number>(0);
  const initializedRef = useRef(false);

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
    const start = startOfWeek(addMonths(anchorDate, -PAST_MONTH_SPAN), 0);
    const endMonth = addMonths(anchorDate, FUTURE_MONTH_SPAN + 1);
    const end = startOfWeek(endMonth, 0);

    const weeks: MonthWeekItem[] = [];
    const monthStartIndex: Record<string, number> = {};
    let cursor = start;
    while (cursor < end) {
      const days = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
      // 週内で日数が最も多い月を代表月にする（同数は後ろ優先）
      const monthCounts: Record<string, { count: number; sample: Date }> = {};
      days.forEach((d) => {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthCounts[key] = { count: (monthCounts[key]?.count ?? 0) + 1, sample: d };
      });
      const rep = Object.values(monthCounts).reduce((best, cur) => {
        if (!best) return cur.sample;
        const bestKey = `${best.getFullYear()}-${best.getMonth()}`;
        const bestCount = monthCounts[bestKey].count;
        if (cur.count > bestCount) return cur.sample;
        if (cur.count === bestCount) return cur.sample; // 同数は後ろ優先
        return best;
      }, undefined as Date | undefined) as Date;

      const labelMonthDay = days.find((d) => d.getDate() === 1);
      // 事前計算: 日毎のイベントキーだけ持たせる（実データは WeekRow で store から参照）
      const dayKeys = days.map((d) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`);
      weeks.push({ start: cursor, days, repMonth: rep, dayKeys });

      if (labelMonthDay) {
        const key = monthKey(labelMonthDay);
        if (monthStartIndex[key] === undefined) monthStartIndex[key] = weeks.length - 1;
      }

      cursor = addDays(cursor, 7);
    }

    const currentIdx = weeks.findIndex((w) => currentDate >= w.start && currentDate < addDays(w.start, 7));
    return { weeks, monthStartIndex, initialIndex: currentIdx >= 0 ? currentIdx : 0 };
  }, [anchorDate, currentDate]);

  // 各月ごとに「ラベルを出す週インデックス」を決定（真ん中あたりの週）
  const weekLabelByIndex = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    weeks.forEach((w, idx) => {
      const key = monthKey(w.repMonth);
      (byMonth[key] ??= []).push(idx);
    });
    const result: Record<number, number> = {};
    Object.entries(byMonth).forEach(([key, indices]) => {
      const sorted = [...indices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const labelIndex = sorted[mid];
      const [, m] = key.split("-").map((v) => Number(v));
      result[labelIndex] = m;
    });
    return result;
  }, [weeks]);

  // 初期インデックスを同期（初回のみスクロール位置と月を揃える）
  useEffect(() => {
    if (!weeks.length) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      const safeIndex = clamp(initialIndex, 0, weeks.length - 1);
      currentIndexRef.current = safeIndex;
      const initialMonth = weeks[safeIndex]?.repMonth ?? currentDate;
      const m = startOfMonth(initialMonth);
      setVisibleMonth(m);
      setDate(m);
    } else {
      // 週データ構造が変わった場合も、currentIndexRef だけ範囲内に補正
      currentIndexRef.current = clamp(currentIndexRef.current, 0, weeks.length - 1);
    }
  }, [weeks, initialIndex, currentDate, setDate]);

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

  // 可視週の「見えている日数」を月ごとに集計し、最多の月をヘッダーに採用
  const updateMonthByOffset = useCallback(
    (offsetY: number, viewportH: number) => {
      if (!weeks.length) return;
      const firstIdx = clamp(Math.floor(offsetY / itemHeight) - 1, 0, weeks.length - 1);
      const lastIdx = clamp(Math.floor((offsetY + viewportH) / itemHeight) + 1, 0, weeks.length - 1);

      const scores: Record<string, number> = {};
      const dayHeight = itemHeight / 7;

      for (let i = firstIdx; i <= lastIdx; i++) {
        const week = weeks[i];
        if (!week) continue;

        const weekTop = i * itemHeight;
        const weekBottom = weekTop + itemHeight;
        const overlapTop = Math.max(weekTop, offsetY);
        const overlapBottom = Math.min(weekBottom, offsetY + viewportH);
        if (overlapBottom <= overlapTop) continue;

        // 日単位で可視高さを積算
        week.days.forEach((d, idx) => {
          const dayTop = weekTop + idx * dayHeight;
          const dayBottom = dayTop + dayHeight;
          const visTop = Math.max(dayTop, overlapTop);
          const visBottom = Math.min(dayBottom, overlapBottom);
          const vis = Math.max(0, visBottom - visTop);
          if (vis <= 0) return;
          const key = monthKey(d);
          scores[key] = (scores[key] ?? 0) + vis;
        });
      }

      let bestMonthKey: string | undefined;
      let bestScore = -1;
      Object.entries(scores).forEach(([k, v]) => {
        if (v > bestScore) {
          bestScore = v;
          bestMonthKey = k;
        }
      });

      if (!bestMonthKey) return;
      const [y, m] = bestMonthKey.split("-").map((v) => Number(v));
      const monthDate = startOfMonth(new Date(y, m - 1, 1));
      if (monthDate.getTime() === visibleMonth.getTime()) return; // 変化なしならスキップ

      setVisibleMonth(monthDate);
      setDate(monthDate);
    },
    [itemHeight, weeks, setDate, visibleMonth]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MonthWeekItem; index: number }) => {
      return (
        <View style={{ height: itemHeight }}>
          <MonthWeekRow
            days={item.days}
            repMonth={item.repMonth}
            dayKeys={item.dayKeys}
            monthLabelNumber={weekLabelByIndex[index]}
            cellSize={cellSize}
            cellHeight={cellHeight}
            onSelectDate={handleSelectDate}
          />
        </View>
      );
    },
    [cellSize, cellHeight, handleSelectDate, itemHeight, weekLabelByIndex]
  );

  const keyExtractor = useCallback((item: MonthWeekItem) => item.start.toISOString(), []);

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
        // スクロール停止時に月を判定
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => updateMonthByOffset(e.nativeEvent.contentOffset.y, e.nativeEvent.layoutMeasurement.height)}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => updateMonthByOffset(e.nativeEvent.contentOffset.y, e.nativeEvent.layoutMeasurement.height)}
        scrollEventThrottle={16}
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
