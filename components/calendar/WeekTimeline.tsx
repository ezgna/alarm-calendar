import React, { useMemo, useRef } from 'react';
import { ScrollView, Text, View, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { getWeekDates, formatLocalDay } from '../../lib/date';
import { useCalendarStore } from '../../features/calendar/store';
import { useEventStore } from '../../features/events/store';
import EventChip from '../common/EventChip';
import { router } from 'expo-router';

// 見やすさのための基準値
const TIME_COL_WIDTH = 48; // 左の時刻欄の幅
const HOUR_HEIGHT = 56; // 1時間あたりの高さ(px)
const CONTENT_HEIGHT = HOUR_HEIGHT * 24; // 一日の全高

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
              >
                {/* 各時間の罫線 */}
                {Array.from({ length: 25 }, (_, h) => (
                  <View key={h} style={{ position: 'absolute', top: h * HOUR_HEIGHT, left: 0, right: 0 }}>
                    <View className="h-px bg-neutral-200 w-full" />
                  </View>
                ))}

                {/* イベントチップ（開始時刻のみ） */}
                {eventsByDay[col].map((ev) => {
                  const dt = new Date(ev.startAt);
                  const minutes = dt.getHours() * 60 + dt.getMinutes();
                  const top = (minutes / 60) * HOUR_HEIGHT + 2;
                  return (
                    <View key={ev.id} style={{ position: 'absolute', top, left: 4, right: 4 }}>
                      <EventChip title={ev.title} colorId={ev.colorId} onPress={() => router.push({ pathname: '/(modal)/event-editor', params: { id: ev.id } })} />
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
