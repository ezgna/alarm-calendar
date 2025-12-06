import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { formatLocalDay } from "../../lib/date";
import { useEventStore } from "../../features/events/store";
import { router } from "expo-router";
import { getColorClasses, DEFAULT_COLOR_ID } from "../common/colorVariants";
import { useThemeTokens } from "../../features/theme/useTheme";
import { useHolidayStore } from "../../features/holidays/store";
import type { JpHoliday } from "../../features/holidays/service";

export type MonthWeekItem = {
  start: Date;
  days: Date[];
  repMonth: Date;
  dayKeys: string[]; // YYYY-MM-DD を事前計算
};

type Props = {
  days: Date[];
  repMonth: Date;
  dayKeys: string[];
  cellSize: number;
  cellHeight: number;
  monthLabelNumber?: number;
  onSelectDate?: (date: Date) => void;
};

export default function MonthWeekRow({ days, repMonth, dayKeys, cellSize, cellHeight, monthLabelNumber, onSelectDate }: Props) {
  const { t, flavor } = useThemeTokens();
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);
  const getHolidaysByDate = useHolidayStore((s) => s.getByDate);

  const repMonthValue = repMonth.getMonth();
  const repMonthYear = repMonth.getFullYear();
  const todayKey = formatLocalDay(new Date());

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {monthLabelNumber != null && (
        // 2桁（月10,11,12）の場合は少し縮小してセル幅に収まるようにする
        // この週+次の週の2行ぶんを跨ぎつつ、水曜カラム中央に表示する
        (() => {
          const isDouble = monthLabelNumber >= 10;
          const labelFontSize = cellHeight * (isDouble ? 0.45 : 0.55);
          return (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -cellHeight,
                left: cellSize * 3,
                width: cellSize,
                height: cellHeight * 2,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: labelFontSize,
                  fontWeight: "700",
                  color: "rgba(0,0,0,0.06)",
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {monthLabelNumber}
              </Text>
            </View>
          );
        })()
      )}
      <View className="flex-row flex-1">
        {days.map((date, idx) => {
          const key = dayKeys[idx] ?? formatLocalDay(date);
          const ids = indexByLocalDay[key] || [];
          const events = ids.map((id) => eventsById[id]).filter(Boolean);
          const isToday = key === todayKey;
          const isSameMonth = date.getFullYear() === repMonthYear && date.getMonth() === repMonthValue;
          const holidays = getHolidaysByDate(date) as JpHoliday[];
          const isHoliday = holidays.length > 0 && isSameMonth;

          // セル単位で月パリティ配色（同一列に異なる月が混ざっても個別に色分け）
          const parity = ((date.getFullYear() * 12) + date.getMonth()) % 2;
          const cellBgPalette =
            flavor === "rose"
              ? ["rgba(255,248,245,0.85)", "rgba(255,243,237,0.85)"]
              : ["rgba(247,250,252,0.8)", "rgba(241,245,249,0.8)"];
          const cellBg = cellBgPalette[parity];

          const displayedEvents = isHoliday ? events.slice(0, 2) : events.slice(0, 3);
          const moreCount = events.length - displayedEvents.length;
          const dayColorClass = isToday ? "" : isHoliday ? "text-red-500" : isSameMonth ? t.text : t.textMuted;
          const dayTextClass = `text-xs ${isToday ? "font-bold" : ""} ${dayColorClass}`;

          return (
            <TouchableOpacity
              key={key}
              className={`flex-1 p-1 border-r border-b ${t.border}`}
              style={{ height: cellHeight, backgroundColor: cellBg }}
              onPress={() => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                onSelectDate?.(d);
              }}
              onLongPress={() => {
                const d = new Date(date);
                const now = new Date();
                const isTodayCell = key === todayKey;
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
                    className={`${isToday ? t.badgeTodayBg : "bg-transparent"} rounded-full items-center justify-center`}
                    style={{ width: 24, height: 24 }}
                  >
                    <Text className={dayTextClass}>{date.getDate()}</Text>
                  </View>
                </View>
                {isHoliday && holidays[0] && (
                  <Text className="mt-0.5 text-[10px] text-red-500" numberOfLines={1}>
                    {holidays[0].name}
                  </Text>
                )}
                <View className="mt-1 gap-0.5">
                  {displayedEvents.map((e) => {
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
                  {moreCount > 0 && <Text className={`text-[10px] ${t.textMuted}`}>+{moreCount}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
