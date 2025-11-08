import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from "react-native";
import { useCalendarStore } from "../../features/calendar/store";
import type { EventItem } from "../../features/events/store";
import { useEventStore } from "../../features/events/store";
import { useThemeTokens } from "../../features/theme/useTheme";
import { formatLocalDay, startOfDay } from "../../lib/date";
import EventBar from "../common/EventBar";

const TIME_COL_WIDTH = 56;
const HOUR_HEIGHT = 56;
const CONTENT_HEIGHT = HOUR_HEIGHT * 24;
// 重なり検出に使うチップ想定高さ（px）
const MIN_BAR_PX = 24; // 最小バー高さ
const INNER_MARGIN_PX = 8; // タイムライン左右余白
const COLUMN_GAP_PX = 4; // 列間余白

function yToMinutes(y: number, step = 30) {
  const m = Math.max(0, Math.min(24 * 60, Math.round((y / HOUR_HEIGHT) * 60)));
  const snapped = Math.round(m / step) * step;
  return Math.min(24 * 60, Math.max(0, snapped));
}

export default function DayTimeline() {
  const { t } = useThemeTokens();
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

  // 区間オーバーラップを考慮して等分配置するための前処理
  type Positioned = { ev: EventItem; top: number; height: number; col: number; cols: number };
  const positioned = useMemo<Positioned[]>(() => {
    const dayStart = startOfDay(date);
    // 1) 対象日の範囲にクロップした区間を生成
    const mapped = events
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

    // 2) スイープラインで列割り当て＋クラスタ分割
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
      // 古いアクティブを掃除
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
      // 最小の空き列を探す
      let col = 0;
      while (usedCols.has(col)) col++;
      usedCols.add(col);
      actives.push({ endMin: it.endMin, col });
      clusterItems.push({ idx, col });
      clusterMaxCols = Math.max(clusterMaxCols, col + 1);
    });
    // 最後のクラスタを確定
    finalizeCluster();

    // 3) px 位置へ変換
    const out: Positioned[] = mapped.map((it, i) => {
      const top = (it.startMin / 60) * HOUR_HEIGHT;
      const height = Math.max(MIN_BAR_PX, ((it.endMin - it.startMin) / 60) * HOUR_HEIGHT);
      return { ev: it.ev, top, height, col: assigned[i].col, cols: assigned[i].cols };
    });
    return out;
  }, [events, date]);

  return (
    <View className={`flex-1 ${t.surfaceBg}`}>
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
                <Text className={`text-[10px] ${t.timeText}`}>{h.toString().padStart(2, "0")}:00</Text>
                <View className={`h-px w-full mt-1 ${t.divider}`} />
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
                <View className={`h-px w-full ${t.divider}`} />
              </View>
            ))}

            {/* イベント（区間バー、重なりは横方向に等分） */}
            {(areaWidth > 0 ? positioned : positioned.map((p) => ({ ...p, col: 0, cols: 1 }))).map((p) => {
              const top = p.top + 2;
              const height = p.height;
              if (areaWidth > 0) {
                const inner = Math.max(0, areaWidth - INNER_MARGIN_PX * 2);
                const colW = p.cols > 0 ? (inner - COLUMN_GAP_PX * (p.cols - 1)) / p.cols : inner;
                const left = INNER_MARGIN_PX + p.col * (colW + COLUMN_GAP_PX);
                return (
                  <View key={p.ev.id} style={{ position: "absolute", top, left, width: colW, height }}>
                    <EventBar
                      title={p.ev.title}
                      colorId={p.ev.colorId}
                      onPress={() => router.push({ pathname: "/(modal)/event-editor", params: { id: p.ev.id } })}
                    />
                  </View>
                );
              }
              // 初期計測前: 全幅表示
              return (
                <View key={p.ev.id} style={{ position: "absolute", top, left: INNER_MARGIN_PX, right: INNER_MARGIN_PX, height }}>
                  <EventBar
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
