import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DEFAULT_COLOR_ID } from '../../components/common/colorVariants';
import ColorPicker from '../../components/common/ColorPicker';
import { useEventStore } from '../../features/events/store';
import { toUtcIsoString, fromUtcIsoToLocalDate } from '../../lib/date';

export default function EventEditor() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const initialDateStr = typeof params.date === 'string' ? params.date : undefined;

  const getById = useEventStore((s) => s.eventsById);
  const add = useEventStore((s) => s.add);
  const update = useEventStore((s) => s.update);
  const remove = useEventStore((s) => s.remove);

  const existing = id ? getById[id] : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [colorId, setColorId] = useState(existing?.colorId ?? DEFAULT_COLOR_ID);
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [date, setDate] = useState<Date>(() => {
    if (existing) return fromUtcIsoToLocalDate(existing.startAt);
    if (initialDateStr) return new Date(initialDateStr);
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS === 'android') setShowPicker(false);
  }, []);

  const onSave = () => {
    if (!title.trim()) return; // タイトル必須
    const utcIso = toUtcIsoString(date);
    if (existing) {
      update(existing.id, { title: title.trim(), colorId, memo, startAt: utcIso });
    } else {
      add({ title: title.trim(), colorId, memo, startAt: utcIso });
    }
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(
      '削除の確認',
      'この予定を削除します。元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            try {
              remove(existing.id);
            } finally {
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-2">
        <Text className="text-sm text-neutral-600">タイトル（必須）</Text>
        <TextInput
          className="border border-neutral-300 rounded-md px-3 py-2"
          placeholder="タイトル"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm text-neutral-600">開始日時</Text>
        {Platform.OS === 'android' ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="px-3 py-2 rounded-md bg-neutral-100"
              onPress={() => setShowPicker(true)}
            >
              <Text>{date.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {(Platform.OS === 'ios' || showPicker) && (
          <DateTimePicker
            value={date}
            mode="datetime"
            onChange={(_, d) => {
              if (d) setDate(d);
              if (Platform.OS === 'android') setShowPicker(false);
            }}
          />
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm text-neutral-600">カテゴリ色</Text>
        <ColorPicker value={colorId} onChange={setColorId} />
      </View>

      <View className="gap-2">
        <Text className="text-sm text-neutral-600">メモ</Text>
        <TextInput
          className="border border-neutral-300 rounded-md px-3 py-2 h-24"
          placeholder="メモ"
          value={memo}
          onChangeText={setMemo}
          multiline
        />
      </View>

      <View className="flex-row gap-8 mt-4">
        {existing ? (
          <TouchableOpacity className="px-4 py-2 rounded-md bg-red-600" onPress={confirmDelete}>
            <Text className="text-white font-semibold">削除</Text>
          </TouchableOpacity>
        ) : null}
        <View className="flex-1" />
        <TouchableOpacity className="px-4 py-2 rounded-md bg-neutral-200" onPress={() => router.back()}>
          <Text className="text-neutral-900 font-semibold">キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-4 py-2 rounded-md bg-blue-600" onPress={onSave}>
          <Text className="text-white font-semibold">保存</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
