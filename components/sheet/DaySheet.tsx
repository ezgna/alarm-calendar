import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useEventStore, EventItem } from "@/features/events/store";
import BottomSheet from "./BottomSheet";
import { useThemeTokens } from "@/features/theme/useTheme";
import { getColorClasses, DEFAULT_COLOR_ID } from "@/components/common/colorVariants";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatLocalDay } from "@/lib/date";

const timeFormatter = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
const dateFormatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

type Props = {
  visible: boolean;
  date: Date | null;
  onRequestClose: () => void;
  onClosed: () => void;
};

export default function DaySheet({ visible, date, onRequestClose, onClosed }: Props) {
  const { t, flavor } = useThemeTokens();
  const closeIconColor = flavor === "rose" ? "#7f1d1d" : flavor === "mist" ? "#1f2937" : "#111827";

  const indexByLocalDay = useEventStore((state) => state.indexByLocalDay);
  const eventsById = useEventStore((state) => state.eventsById);
  const events = useMemo(() => {
    if (!date) return [];
    const key = formatLocalDay(date);
    const ids = indexByLocalDay[key] || [];
    return ids.map((id) => eventsById[id]).filter(Boolean);
  }, [date, indexByLocalDay, eventsById]);
  const headerLabel = useMemo(() => (date ? dateFormatter.format(date) : ""), [date]);

  const handleCreate = () => {
    if (!date) return;
    const now = new Date();
    const target = new Date(date);
    const isToday = formatLocalDay(target) === formatLocalDay(now);
    if (isToday) {
      target.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      target.setHours(0, 0, 0, 0);
    }
    router.push({ pathname: "/(modal)/event-editor", params: { date: target.toISOString() } });
  };

  const handleEdit = (id: string) => {
    router.push({ pathname: "/(modal)/event-editor", params: { id } });
  };

  const hasDate = !!date;

  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose} onClosed={onClosed}>
      <View className={`flex-1 ${t.appBg}`}>
        <View className="px-5 pt-4 pb-3 border-b border-neutral-200 flex-row items-center justify-between">
          <Text className={`text-base font-semibold ${t.text}`}>{headerLabel}</Text>
          <Pressable onPress={onRequestClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={closeIconColor} />
          </Pressable>
        </View>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            hasDate ? (
              <View className="py-12 items-center gap-3">
                <Text className={`text-base ${t.text}`}>予定なし</Text>
                <CreateButton onPress={handleCreate} t={t} />
              </View>
            ) : null
          )}
          renderItem={({ item }) => <EventRow event={item} onPress={() => handleEdit(item.id)} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListFooterComponent={() => (
            hasDate && events.length > 0 ? (
              <View className="pt-4">
                <CreateButton onPress={handleCreate} t={t} />
              </View>
            ) : null
          )}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  );
}

type RowProps = {
  event: EventItem;
  onPress: () => void;
};

function EventRow({ event, onPress }: RowProps) {
  const { t } = useThemeTokens();
  const c = getColorClasses(event.colorId ?? DEFAULT_COLOR_ID);
  const start = new Date(event.startAt);
  // 新規予定作成では終了時刻を入力していないため、DaySheet 上では開始時刻のみを表示する
  const timeLabel = timeFormatter.format(start);

  return (
    <Pressable onPress={onPress} className={`rounded-2xl p-4 ${t.surfaceBg}`}>
      <View className="flex-row items-center gap-2 mb-2">
        <View className={`w-2 h-2 rounded-full ${c.bg}`} />
        <Text className={`text-sm ${t.textMuted}`}>{timeLabel}</Text>
      </View>
      <Text className={`text-lg font-semibold mb-1 ${t.text}`}>{event.title || "(無題)"}</Text>
      {event.memo ? <Text className={`text-sm ${t.textMuted}`} numberOfLines={2}>{event.memo}</Text> : null}
    </Pressable>
  );
}

type CreateButtonProps = {
  onPress: () => void;
  t: ReturnType<typeof useThemeTokens>["t"];
};

function CreateButton({ onPress, t }: CreateButtonProps) {
  return (
    <Pressable className={`px-4 py-3 rounded-full ${t.buttonPrimaryBg} items-center`} onPress={onPress}>
      <Text className={`text-sm font-semibold ${t.buttonPrimaryText}`}>＋ 新規作成</Text>
    </Pressable>
  );
}
