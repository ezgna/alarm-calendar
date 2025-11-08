import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, Pressable, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import { getWeekDates, formatLocalDay, startOfDay, addDays } from '../../lib/date';
import { useCalendarStore } from '../../features/calendar/store';
import { useEventStore } from '../../features/events/store';
import EventBar from '../common/EventBar';
import { router } from 'expo-router';
import type { EventItem } from '../../features/events/store';

// 見やすさのための基準値
const TIME_COL_WIDTH = 48; // 左の時刻欄の幅
const HOUR_HEIGHT = 56; // 1時間あたりの高さ(px)
const CONTENT_HEIGHT = HOUR_HEIGHT * 24; // 一日の全高
const MIN_BAR_PX = 24; // 最小バー高さ
const INNER_MARGIN_PX = 4; // 各カラム内左右余白
const COLUMN_GAP_PX = 4; // 列間

const WEEK_LABELS = ['日','月','火','水','木','金','土'];

// y座標から時刻（分単位）を推定（step分刻み）
function yToMinutes(y: number, step = 30) {
  const m = Math.max(0, Math.min(24 * 60, Math.round((y / HOUR_HEIGHT) * 60)));
  const snapped = Math.round(m / step) * step;
  return Math.min(24 * 60, Math.max(0, snapped));
}

export default function WeekTimeline() {
  const iso = useCalendarStore((s) => s.currentDate);
  const date = useMemo(() => new Date(iso), [iso]);
  const days = useMemo(() => getWeekDates(date, 0), [date]);
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);

  const now = new Date();
  const isCurrentWeek = now >= days[0] && now < new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate() + 7);
  const nowY = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;

  // 各日のイベント
  const eventsByDay = useMemo(() => {
    return days.map((d) => {
      const key = formatLocalDay(d);
      const ids = indexByLocalDay[key] || [];
      return ids.map((id) => eventsById[id]).filter(Boolean);
    });
  }, [days, indexByLocalDay, eventsById]);

  // 各日のカラム幅を保持（重なり時の横幅計算に使用）
  const [colWidths, setColWidths] = useState<number[]>(Array(7).fill(0));
  const setWidthAt = (col: number, w: number) =>
    setColWidths((prev) => (prev[col] === w ? prev : prev.map((v, i) => (i === col ? w : v))));

  // 重なりイベントを等分配置するためのレイアウト計算（各日ごと、区間対応）
  type Positioned = { ev: EventItem; top: number; height: number; col: number; cols: number };
  const positionedByDay: Positioned[][] = useMemo(() => {
    return days.map((day, dayIndex) => {
      const evts = eventsByDay[dayIndex] || [];
      const dayStart = startOfDay(day);
      const dayEnd = addDays(dayStart, 1);
      const mapped = evts
        .map((ev) => {
          const ls = new Date(ev.startAt);
          const le = new Date(ev.endAt);
          const s = Math.max(0, Math.floor((ls.getTime() - dayStart.getTime()) / 60000));
          const e = Math.min(24 * 60, Math.ceil((le.getTime() - dayStart.getTime()) / 60000));
          const startMin = Math.max(0, Math.min(24 * 60, s));
          const endMin = Math.max(startMin + 1, Math.min(24 * 60, e));
          return { ev, startMin, endMin };
        })
        .filter((x) => x.endMin > x.startMin)
        .sort((a, b) => (a.startMin - b.startMin) || (a.endMin - b.endMin));

      type Active = { endMin: number; col: number };
      let actives: Active[] = [];
      let usedCols: Set<number> = new Set();
      let clusterItems: { idx: number; col: number }[] = [];
      let clusterMaxCols = 0;
      const assigned: { col: number; cols: number }[] = new Array(mapped.length) as any;
      const finalizeCluster = () => {
        for (const it of clusterItems) {
          assigned[it.idx] = { col: it.col, cols: Math.max(clusterMaxCols, usedCols.size) };
        }
        clusterItems = [];
        clusterMaxCols = 0;
      };

      mapped.forEach((it, idx) => {
        actives = actives.filter((a) => {
          if (a.endMin <= it.startMin) {
            usedCols.delete(a.col);
            return false;
          }
          return true;
        });
        if (actives.length === 0 && clusterItems.length > 0) {
          finalizeCluster();
        }
        let col = 0;
        while (usedCols.has(col)) col++;
        usedCols.add(col);
        actives.push({ endMin: it.endMin, col });
        clusterItems.push({ idx, col });
        clusterMaxCols = Math.max(clusterMaxCols, col + 1);
      });
      finalizeCluster();

      const out: Positioned[] = mapped.map((it, i) => {
        const top = (it.startMin / 60) * HOUR_HEIGHT;
        const height = Math.max(MIN_BAR_PX, ((it.endMin - it.startMin) / 60) * HOUR_HEIGHT);
        return { ev: it.ev, top, height, col: assigned[i].col, cols: assigned[i].cols };
      });
      return out;
    });
  }, [eventsByDay, days]);

  return (
    <View className="flex-1 bg-white">
      {/* 上部の曜日ヘッダー */}
      <View className="flex-row border-b border-neutral-200">
        <View style={{ width: TIME_COL_WIDTH }} className="items-center justify-center py-2">
          <Text className="text-neutral-500 text-xs">時間</Text>
        </View>
        {days.map((d, i) => {
          const isToday = new Date().toDateString() === d.toDateString();
          return (
            <View key={i} className="flex-1 items-center py-2">
              <Text className={`text-xs ${isToday ? 'text-blue-600 font-bold' : 'text-neutral-600'}`}>
                {WEEK_LABELS[d.getDay()]} {d.getMonth() + 1}/{d.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* タイムライン本体 */}
      {/* Day と同様に最下部に余白を設けるため、
          contentContainer の高さを増やす（paddingBottom ではスクロール領域が増えない）。
          週ビューは約40分相当の余白として HOUR_HEIGHT / 1.5 を追加。*/}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: CONTENT_HEIGHT + HOUR_HEIGHT / 1.5 }}
      >
        <View className="flex-row" style={{ height: CONTENT_HEIGHT }}>
          {/* 時刻欄 */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {Array.from({ length: 25 }, (_, h) => (
              <View key={h} style={{ height: HOUR_HEIGHT }} className="items-center">
                <Text className="text-[10px] text-neutral-500">{h.toString().padStart(2, '0')}:00</Text>
                <View className="h-px bg-neutral-200 w-full mt-1" />
              </View>
            ))}
          </View>

          {/* 7日分のカラム */}
          <View className="flex-1 flex-row">
            {days.map((day, col) => (
              <Pressable
                key={col}
                className="flex-1 border-l border-neutral-100"
                onPress={(e) => {
                  const y = e.nativeEvent.locationY;
                  const minutes = yToMinutes(y, 30);
                  const d = new Date(day);
                  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                  router.push({ pathname: '/(modal)/event-editor', params: { date: d.toISOString() } });
                }}
                style={{ height: CONTENT_HEIGHT }}
                onLayout={(e: LayoutChangeEvent) => setWidthAt(col, e.nativeEvent.layout.width)}
              >
                {/* 各時間の罫線 */}
                {Array.from({ length: 25 }, (_, h) => (
                  <View key={h} style={{ position: 'absolute', top: h * HOUR_HEIGHT, left: 0, right: 0 }}>
                    <View className="h-px bg-neutral-200 w-full" />
                  </View>
                ))}

                {/* イベントバー（重なり時は横方向に等分） */}
                {(colWidths[col] > 0 ? positionedByDay[col] : positionedByDay[col].map((p) => ({ ...p, col: 0, cols: 1 }))).map((p) => {
                  const top = p.top + 2;
                  const height = p.height;
                  if (colWidths[col] > 0) {
                    const inner = Math.max(0, colWidths[col] - INNER_MARGIN_PX * 2);
                    const colW = p.cols > 0 ? (inner - COLUMN_GAP_PX * (p.cols - 1)) / p.cols : inner;
                    const left = INNER_MARGIN_PX + p.col * (colW + COLUMN_GAP_PX);
                    return (
                      <View key={p.ev.id} style={{ position: 'absolute', top, left, width: colW, height }}>
                        <EventBar
                          title={p.ev.title}
                          colorId={p.ev.colorId}
                          onPress={() => router.push({ pathname: '/(modal)/event-editor', params: { id: p.ev.id } })}
                        />
                      </View>
                    );
                  }
                  return (
                    <View key={p.ev.id} style={{ position: 'absolute', top, left: INNER_MARGIN_PX, right: INNER_MARGIN_PX, height }}>
                      <EventBar
                        title={p.ev.title}
                        colorId={p.ev.colorId}
                        onPress={() => router.push({ pathname: '/(modal)/event-editor', params: { id: p.ev.id } })}
                      />
                    </View>
                  );
                })}
              </Pressable>
            ))}
          </View>
        </View>

        {/* 現在時刻ライン */}
        {isCurrentWeek && (
          <View style={{ position: 'absolute', left: TIME_COL_WIDTH, right: 0, top: nowY }}>
            <View className="h-0.5 bg-red-500" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
