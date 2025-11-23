import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { formatLocalDay, startOfMonth } from "../../lib/date";
import { useEventStore } from "../../features/events/store";
import { router } from "expo-router";
import { getColorClasses, DEFAULT_COLOR_ID } from "../common/colorVariants";
import { useThemeTokens } from "../../features/theme/useTheme";

type Props = {
  baseDate: Date;
  cellSize: number; // 横幅（7等分）
  cellHeight: number; // 縦幅（ユーザー調整用）
  onSelectDate?: (date: Date) => void;
};

export default function MonthGrid({ baseDate, cellSize, cellHeight, onSelectDate }: Props) {
  const { t } = useThemeTokens();
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);

  const start = startOfMonth(baseDate);
  const startWeekday = start.getDay();
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const leadingEmpty = startWeekday;
  const totalCells = leadingEmpty + daysInMonth;
  const trailingEmpty = (7 - (totalCells % 7)) % 7;
  const cellCount = totalCells + trailingEmpty;

  const cells = useMemo(() => {
    const arr: Array<
      | { type: "empty"; key: string }
      | { type: "day"; key: string; date: Date; isToday: boolean; events: any[] }
    > = [];

    for (let i = 0; i < leadingEmpty; i++) {
      arr.push({ type: "empty", key: `lead-${i}` });
    }

    const todayKey = formatLocalDay(new Date());

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
      const key = formatLocalDay(date);
      const ids = indexByLocalDay[key] || [];
      const events = ids.map((id) => eventsById[id]).filter(Boolean);
      arr.push({ type: "day", key, date, isToday: key === todayKey, events });
    }

    for (let i = 0; i < trailingEmpty; i++) {
      arr.push({ type: "empty", key: `trail-${i}` });
    }

    return arr;
  }, [baseDate, daysInMonth, leadingEmpty, trailingEmpty, indexByLocalDay, eventsById]);

  const weeks = Math.ceil(cellCount / 7) || 4;

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <View style={{ height: cellHeight * weeks }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((item, index) => {
            const isLastRow = index >= cells.length - 7;
            if (item.type === "empty") {
              return (
                <View
                  key={item.key}
                  className={`${isLastRow ? "" : "border-b"} border-r ${t.border}`}
                  style={{ width: cellSize, height: cellHeight }}
                />
              );
            }

            return (
              <TouchableOpacity
                key={item.key}
                className={`p-1 ${isLastRow ? "" : "border-b"} border-r ${t.border} ${t.appBg}`}
                style={{ width: cellSize, height: cellHeight }}
                onPress={() => {
                  const d = new Date(item.date);
                  d.setHours(0, 0, 0, 0);
                  onSelectDate?.(d);
                }}
                onLongPress={() => {
                  const d = new Date(item.date);
                  const now = new Date();
                  const isTodayCell = formatLocalDay(d) === formatLocalDay(new Date());
                  if (isTodayCell) {
                    d.setHours(now.getHours(), now.getMinutes(), 0, 0);
                  } else {
                    d.setHours(0, 0, 0, 0);
                  }
                  router.push({ pathname: "/(modal)/event-editor", params: { date: d.toISOString() } });
                }}
              >
                <View className="flex-1">
                  <View className="items-start">
                    <View
                      className={`${item.isToday ? t.badgeTodayBg : "bg-transparent"} rounded-full items-center justify-center`}
                      style={{ width: 24, height: 24 }}
                    >
                      <Text className={`text-xs ${item.isToday ? `font-bold` : t.text}`}>
                        {item.date.getDate()}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-1 gap-0.5">
                    {item.events.slice(0, 3).map((e) => {
                      const c = getColorClasses(e.colorId ?? DEFAULT_COLOR_ID);
                      return (
                        <View key={e.id} className="w-full">
                          <View className={`rounded px-1 py-0.5 ${c.bg}`}>
                            <Text className={`text-[10px] ${c.text}`} numberOfLines={1}>
                              {e.title}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                    {item.events.length > 3 && <Text className={`text-[10px] ${t.textMuted}`}>+{item.events.length - 3}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
