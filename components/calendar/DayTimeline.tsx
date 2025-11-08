import React, { useMemo } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useCalendarStore } from "../../features/calendar/store";
import { useEventStore } from "../../features/events/store";
import { formatLocalDay } from "../../lib/date";
import EventChip from "../common/EventChip";
import { router } from "expo-router";

const TIME_COL_WIDTH = 56;
const HOUR_HEIGHT = 56;
const CONTENT_HEIGHT = HOUR_HEIGHT * 24;

function yToMinutes(y: number, step = 30) {
  const m = Math.max(0, Math.min(24 * 60, Math.round((y / HOUR_HEIGHT) * 60)));
  const snapped = Math.round(m / step) * step;
  return Math.min(24 * 60, Math.max(0, snapped));
}

export default function DayTimeline() {
  const iso = useCalendarStore((s) => s.currentDate);
  const date = useMemo(() => new Date(iso), [iso]);
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);
  const events = useMemo(() => {
    const key = formatLocalDay(date);
    const ids = indexByLocalDay[key] || [];
    return ids.map((id) => eventsById[id]).filter(Boolean);
  }, [date, indexByLocalDay, eventsById]);
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const nowY = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ height: CONTENT_HEIGHT }}>
        <View className="flex-row" style={{ height: CONTENT_HEIGHT }}>
          {/* 時刻欄 */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {Array.from({ length: 25 }, (_, h) => (
              <View key={h} style={{ height: HOUR_HEIGHT }} className="items-center">
                <Text className="text-[10px] text-neutral-500">{h.toString().padStart(2, "0")}:00</Text>
                <View className="h-px bg-neutral-200 w-full mt-1" />
              </View>
            ))}
          </View>
          {/* 単一日のタイムライン */}
          <Pressable
            className="flex-1"
            onPress={(e) => {
              const y = e.nativeEvent.locationY;
              const minutes = yToMinutes(y, 30);
              const d = new Date(date);
              d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
              router.push({ pathname: "/(modal)/event-editor", params: { date: d.toISOString() } });
            }}
            style={{ height: CONTENT_HEIGHT }}
          >
            {/* 罫線 */}
            {Array.from({ length: 25 }, (_, h) => (
              <View key={h} style={{ position: "absolute", top: h * HOUR_HEIGHT, left: 0, right: 0 }}>
                <View className="h-px bg-neutral-200 w-full" />
              </View>
            ))}

            {/* イベント */}
            {events.map((ev) => {
              const dt = new Date(ev.startAt);
              const minutes = dt.getHours() * 60 + dt.getMinutes();
              const top = (minutes / 60) * HOUR_HEIGHT + 2;
              return (
                <View key={ev.id} style={{ position: "absolute", top, left: 8, right: 8 }}>
                  <EventChip title={ev.title} colorId={ev.colorId} onPress={() => router.push({ pathname: "/(modal)/event-editor", params: { id: ev.id } })} />
                </View>
              );
            })}

            {/* 現在時刻ライン */}
            {isToday && (
              <View style={{ position: "absolute", left: 0, right: 0, top: nowY }}>
                <View className="h-0.5 bg-red-500" />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
