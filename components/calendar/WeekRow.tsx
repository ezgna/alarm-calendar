import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { formatLocalDay } from "../../lib/date";
import { useEventStore } from "../../features/events/store";
import { router } from "expo-router";
import { getColorClasses, DEFAULT_COLOR_ID } from "../common/colorVariants";
import { useThemeTokens } from "../../features/theme/useTheme";

export type WeekItem = {
  start: Date;
  days: Date[];
  repMonth: Date;
  stripeIndex: number; // 0/1 の交互ストライプ
  dayKeys: string[]; // YYYY-MM-DD を事前計算
};

type Props = {
  days: Date[];
  repMonth: Date;
  stripeIndex: number;
  dayKeys: string[];
  cellSize: number;
  cellHeight: number;
  onSelectDate?: (date: Date) => void;
};

export default function WeekRow({ days, repMonth, stripeIndex, dayKeys, cellSize, cellHeight, onSelectDate }: Props) {
  const { t } = useThemeTokens();
  const indexByLocalDay = useEventStore((s) => s.indexByLocalDay);
  const eventsById = useEventStore((s) => s.eventsById);

  const repMonthValue = repMonth.getMonth();
  const repMonthYear = repMonth.getFullYear();
  const todayKey = formatLocalDay(new Date());

  const stripeColors = t.flavor === "rose"
    ? ["rgba(255,248,245,0.85)", "rgba(255,243,237,0.85)"]
    : ["rgba(247,250,252,0.8)", "rgba(241,245,249,0.8)"]; // mist もしくはその他

  const rowBg = stripeColors[Math.abs(stripeIndex) % stripeColors.length];

  return (
    <View style={{ flex: 1, backgroundColor: rowBg, position: "relative" }}>
      <View className="flex-row flex-1">
        {days.map((date, idx) => {
          const key = dayKeys[idx] ?? formatLocalDay(date);
          const ids = indexByLocalDay[key] || [];
          const events = ids.map((id) => eventsById[id]).filter(Boolean);
          const isToday = key === todayKey;
          const isSameMonth = date.getFullYear() === repMonthYear && date.getMonth() === repMonthValue;

          return (
            <TouchableOpacity
              key={key}
              className={`flex-1 p-1 border-r border-b ${t.border}`}
              style={{ height: cellHeight, backgroundColor: "transparent" }}
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
                    <Text className={`text-xs ${isToday ? "font-bold" : isSameMonth ? t.text : t.textMuted}`}>
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
                <View className="mt-1 gap-0.5">
                  {events.slice(0, 3).map((e) => {
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
                  {events.length > 3 && <Text className={`text-[10px] ${t.textMuted}`}>+{events.length - 3}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
