import React, { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getMonthMatrix, formatLocalDay } from '../../lib/date';
import { useCalendarStore } from '../../features/calendar/store';
import { useEventStore } from '../../features/events/store';
import { router } from 'expo-router';
import { COLOR_BY_ID, DEFAULT_COLOR_ID } from '../../features/events/colors';

function formatMonthLabel(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}年 ${m}月`;
}

export default function MonthGrid() {
  const [gridHeight, setGridHeight] = useState(0);
  const cell = gridHeight > 0 ? Math.floor(gridHeight / 6) : 0;
  const currentIso = useCalendarStore((s) => s.currentDate);
  const date = useMemo(() => new Date(currentIso), [currentIso]);
  const month = date.getMonth();
  const matrix = useMemo(() => getMonthMatrix(date, 0), [date]);
  const getByDay = useEventStore((s) => s.getEventsByLocalDay);

  const data = useMemo(() => matrix.map((d) => ({
    date: d,
    isCurrentMonth: d.getMonth() === month,
    key: formatLocalDay(d),
    events: getByDay(d),
  })), [matrix, month, getByDay]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row px-4 py-2 border-b border-neutral-200">
        {['日','月','火','水','木','金','土'].map((w) => (
          <View key={w} className="flex-1 items-center">
            <Text className="text-neutral-500 text-xs">{w}</Text>
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
              className={`flex-1 p-1 border-b border-r border-neutral-100 ${
                item.isCurrentMonth ? 'bg-white' : 'bg-neutral-50'
              }`}
              style={{ height: cell || undefined }}
              onPress={() => {
                // 日にちタップでその日に遷移
                useCalendarStore.getState().setDate(new Date(item.date));
                useCalendarStore.getState().setView('day');
                router.navigate('/(drawer)/day');
              }}
              onLongPress={() => {
                const d = new Date(item.date);
                d.setHours(new Date().getHours(), 0, 0, 0);
                router.push({ pathname: '/(modal)/event-editor', params: { date: d.toISOString() } });
              }}
            >
              <View className="flex-1">
                <Text className={`text-xs ${item.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {item.date.getDate()}
                </Text>
              <View className="mt-1 gap-0.5">
                {item.events.slice(0, 3).map((e) => {
                  const c = COLOR_BY_ID[e.colorId] ?? COLOR_BY_ID[DEFAULT_COLOR_ID];
                  return (
                    <View key={e.id} className="flex-row items-center gap-1">
                      <View className={`w-1.5 h-1.5 rounded-full ${c.classes.dot}`} />
                      <Text className="text-[10px] text-neutral-700" numberOfLines={1}>
                        {e.title}
                      </Text>
                    </View>
                  );
                })}
                {item.events.length > 3 && (
                  <Text className="text-[10px] text-neutral-500">+{item.events.length - 3}</Text>
                )}
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
