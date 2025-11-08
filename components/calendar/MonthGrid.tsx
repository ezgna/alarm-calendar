import React, { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { getMonthMatrix, formatLocalDay } from "../../lib/date";
import { useCalendarStore } from "../../features/calendar/store";
import { useEventStore } from "../../features/events/store";
import { router } from "expo-router";
import { getColorClasses, DEFAULT_COLOR_ID } from "../common/colorVariants";
import { useThemeTokens } from "../../features/theme/useTheme";

export default function MonthGrid() {
  const { t } = useThemeTokens();
  const [gridHeight, setGridHeight] = useState(0);
  const cell = gridHeight > 0 ? Math.floor(gridHeight / 6) : 0;
  const currentIso = useCalendarStore((s) => s.currentDate);
  const date = useMemo(() => new Date(currentIso), [currentIso]);
  const month = date.getMonth();
  const matrix = useMemo(() => getMonthMatrix(date, 0), [date]);
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);
  const todayKey = formatLocalDay(new Date());

  const data = useMemo(
    () =>
      matrix.map((d) => {
        const key = formatLocalDay(d);
        const ids = indexByLocalDay[key] || [];
        const events = ids.map((id) => eventsById[id]).filter(Boolean);
        return {
          date: d,
          isCurrentMonth: d.getMonth() === month,
          isToday: key === todayKey,
          key,
          events,
        };
      }),
    [matrix, month, indexByLocalDay, eventsById, todayKey]
  );

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <View className={`flex-row py-2 border-b ${t.headerBorder}`}>
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <View key={w} className="flex-1 items-center">
            <Text className={`text-xs ${t.textMuted}`}>{w}</Text>
          </View>
        ))}
      </View>
      <View className="flex-1" onLayout={(e) => setGridHeight(e.nativeEvent.layout.height)}>
        <FlatList
          data={data}
          numColumns={7}
          keyExtractor={(item) => item.key}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-1 p-1 border-b border-r ${t.border} ${item.isCurrentMonth ? t.surfaceBg : t.surfaceBg}`}
              style={{ height: cell || undefined }}
              onPress={() => {
                // 日にちタップでその日に遷移
                // Day 画面側で「月から来た」ことを判定できるように origin=month を付与
                useCalendarStore.getState().setDate(new Date(item.date));
                useCalendarStore.getState().setView("day");
                router.push({ pathname: "/(drawer)/day", params: { origin: "month" } });
              }}
              onLongPress={() => {
                const d = new Date(item.date);
                d.setHours(new Date().getHours(), 0, 0, 0);
                router.push({ pathname: "/(modal)/event-editor", params: { date: d.toISOString() } });
              }}
            >
              <View className="flex-1">
                {/* 今日の日付は丸いバッジで強調（ブルー背景＋白文字） */}
                <View className="items-start">
                  <View
                    className={`${item.isToday ? t.badgeTodayBg : "bg-transparent"} rounded-full items-center justify-center`}
                    style={{ width: 24, height: 24 }}
                  >
                    <Text
                      className={`text-xs ${
                        item.isToday
                          ? `${t.badgeTodayText} font-bold`
                          : item.isCurrentMonth
                          ? t.text
                          : t.textMuted
                      }`}
                    >
                      {item.date.getDate()}
                    </Text>
                  </View>
                </View>
                <View className="mt-1 gap-0.5">
                  {item.events.slice(0, 3).map((e) => {
                    const c = getColorClasses(e.colorId ?? DEFAULT_COLOR_ID);
                    return (
                      <View key={e.id} className="flex-row items-center gap-1">
                        <View className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <Text className={`text-[10px] ${t.text}`} numberOfLines={1}>
                          {e.title}
                        </Text>
                      </View>
                    );
                  })}
                  {item.events.length > 3 && <Text className={`text-[10px] ${t.textMuted}`}>+{item.events.length - 3}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{}}
        />
      </View>
    </View>
  );
}
