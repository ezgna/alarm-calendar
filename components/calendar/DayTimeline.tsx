import React, { useMemo, useState } from "react";
import { ScrollView, Text, View, Pressable, LayoutChangeEvent } from "react-native";
import { useCalendarStore } from "../../features/calendar/store";
import { useEventStore } from "../../features/events/store";
import { formatLocalDay } from "../../lib/date";
import EventChip from "../common/EventChip";
import { router } from "expo-router";
import type { EventItem } from "../../features/events/store";

const TIME_COL_WIDTH = 56;
const HOUR_HEIGHT = 56;
const CONTENT_HEIGHT = HOUR_HEIGHT * 24;
// 重なり検出に使うチップ想定高さ（px）
const CHIP_HEIGHT_PX = 24;
const INNER_MARGIN_PX = 8; // タイムライン左右余白
const COLUMN_GAP_PX = 4; // 列間余白

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
  const [areaWidth, setAreaWidth] = useState(0);

  // 重なりイベントを等分配置するための前処理
  type Positioned = { ev: EventItem; top: number; col: number; cols: number };
  const positioned = useMemo<Positioned[]>(() => {
    const mapped = events
      .map((ev) => {
        const dt = new Date(ev.startAt);
        const minutes = dt.getHours() * 60 + dt.getMinutes();
        const top = (minutes / 60) * HOUR_HEIGHT;
        return { ev, top };
      })
      .sort((a, b) => a.top - b.top);

    const out: Positioned[] = [];
    let cluster: { items: { ev: EventItem; top: number }[]; maxBottom: number } | null = null;
    for (const it of mapped) {
      if (!cluster || it.top >= cluster.maxBottom) {
        if (cluster) {
          const n = cluster.items.length;
          cluster.items.forEach((x, i) => out.push({ ev: x.ev, top: x.top, col: i, cols: n }));
        }
        cluster = { items: [it], maxBottom: it.top + CHIP_HEIGHT_PX };
      } else {
        cluster.items.push(it);
        cluster.maxBottom = Math.max(cluster.maxBottom, it.top + CHIP_HEIGHT_PX);
      }
    }
    if (cluster) {
      const n = cluster.items.length;
      cluster.items.forEach((x, i) => out.push({ ev: x.ev, top: x.top, col: i, cols: n }));
    }
    return out;
  }, [events]);

  return (
    <View className="flex-1 bg-white">
      {/* NOTE: 余白は高さに加算済み */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: CONTENT_HEIGHT + HOUR_HEIGHT / 2 }}
      >
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
            onLayout={(e: LayoutChangeEvent) => setAreaWidth(e.nativeEvent.layout.width)}
          >
            {/* 罫線（各時間の境界） */}
            {Array.from({ length: 25 }, (_, h) => (
              <View key={h} style={{ position: "absolute", top: h * HOUR_HEIGHT, left: 0, right: 0 }}>
                <View className="h-px bg-neutral-200 w-full" />
              </View>
            ))}

            {/* イベント（重なりを検出し、横に等分割して配置） */}
            {(areaWidth > 0 ? positioned : positioned.map((p) => ({ ...p, col: 0, cols: 1 }))).map((p) => {
              const top = p.top + 2;
              if (areaWidth > 0) {
                const inner = Math.max(0, areaWidth - INNER_MARGIN_PX * 2);
                const colW = p.cols > 0 ? (inner - COLUMN_GAP_PX * (p.cols - 1)) / p.cols : inner;
                const left = INNER_MARGIN_PX + p.col * (colW + COLUMN_GAP_PX);
                return (
                  <View key={p.ev.id} style={{ position: "absolute", top, left, width: colW }}>
                    <EventChip
                      title={p.ev.title}
                      colorId={p.ev.colorId}
                      onPress={() => router.push({ pathname: "/(modal)/event-editor", params: { id: p.ev.id } })}
                    />
                  </View>
                );
              }
              // 初期計測前: 全幅表示
              return (
                <View key={p.ev.id} style={{ position: "absolute", top, left: INNER_MARGIN_PX, right: INNER_MARGIN_PX }}>
                  <EventChip
                    title={p.ev.title}
                    colorId={p.ev.colorId}
                    onPress={() => router.push({ pathname: "/(modal)/event-editor", params: { id: p.ev.id } })}
                  />
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
