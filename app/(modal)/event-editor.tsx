import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ColorPicker from '../../components/common/ColorPicker';
import { DEFAULT_COLOR_ID } from '../../components/common/colorVariants';
import { useEventStore } from '../../features/events/store';
import { addMinutes, fromUtcIsoToLocalDate, toUtcIsoString } from '../../lib/date';
import { useThemeTokens } from '../../features/theme/useTheme';

export default function EventEditor() {
  const { t } = useThemeTokens();
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
  const [start, setStart] = useState<Date>(() => {
    if (existing) return fromUtcIsoToLocalDate(existing.startAt);
    if (initialDateStr) return new Date(initialDateStr);
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [end, setEnd] = useState<Date>(() => {
    if (existing?.endAt) return fromUtcIsoToLocalDate(existing.endAt);
    return addMinutes(existing ? fromUtcIsoToLocalDate(existing.startAt) : (initialDateStr ? new Date(initialDateStr) : new Date()), 30);
  });
  const [showStartPicker, setShowStartPicker] = useState(Platform.OS === 'ios');
  const [showEndPicker, setShowEndPicker] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, []);

  const onSave = () => {
    if (!title.trim()) return; // タイトル必須
    const startIso = toUtcIsoString(start);
    const endIso = toUtcIsoString(end <= start ? addMinutes(start, 30) : end);
    if (existing) {
      update(existing.id, { title: title.trim(), colorId, memo, startAt: startIso, endAt: endIso });
    } else {
      add({ title: title.trim(), colorId, memo, startAt: startIso, endAt: endIso });
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
    <ScrollView className={`flex-1 pt-12 p-4 ${t.surfaceBg}`} contentContainerStyle={{ gap: 16 }}>
      <View className="gap-2">
        <Text className={`text-sm ${t.textMuted}`}>タイトル（必須）</Text>
        <TextInput
          className={`border rounded-md px-3 py-2 ${t.border}`}
          placeholder="タイトル"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View className="gap-2">
        <Text className={`text-sm ${t.textMuted}`}>開始日時</Text>
        {Platform.OS === 'android' ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`px-3 py-2 rounded-md ${t.buttonNeutralBg}`}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>{start.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {(Platform.OS === 'ios' || showStartPicker) && (
          <DateTimePicker
            value={start}
            mode="datetime"
            onChange={(_, d) => {
              if (d) {
                setStart(d);
                if (end <= d) setEnd(addMinutes(d, 30));
              }
              if (Platform.OS === 'android') setShowStartPicker(false);
            }}
          />
        )}
      </View>

      <View className="gap-2">
        <Text className={`text-sm ${t.textMuted}`}>終了日時</Text>
        {Platform.OS === 'android' ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`px-3 py-2 rounded-md ${t.buttonNeutralBg}`}
              onPress={() => setShowEndPicker(true)}
            >
              <Text>{end.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {(Platform.OS === 'ios' || showEndPicker) && (
          <DateTimePicker
            value={end}
            mode="datetime"
            onChange={(_, d) => {
              if (d) {
                if (d <= start) setEnd(addMinutes(start, 30));
                else setEnd(d);
              }
              if (Platform.OS === 'android') setShowEndPicker(false);
            }}
          />
        )}
      </View>

      <View className="gap-2">
        <Text className={`text-sm ${t.textMuted}`}>カテゴリ色</Text>
        <ColorPicker value={colorId} onChange={setColorId} />
      </View>

      <View className="gap-2">
        <Text className={`text-sm ${t.textMuted}`}>メモ</Text>
        <TextInput
          className={`border rounded-md px-3 py-2 h-24 ${t.border}`}
          placeholder="メモ"
          value={memo}
          onChangeText={setMemo}
          multiline
        />
      </View>

      <View className="flex-row gap-4 mt-4">
        {existing ? (
          <TouchableOpacity className={`px-4 py-2 rounded-md ${t.dangerBg}`} onPress={confirmDelete}>
            <Text className={`${t.dangerText} font-semibold`}>削除</Text>
          </TouchableOpacity>
        ) : null}
        <View className="flex-1" />
        <TouchableOpacity className={`px-4 py-2 rounded-md ${t.buttonNeutralBg}`} onPress={() => router.back()}>
          <Text className={`${t.buttonNeutralText} font-semibold`}>キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity className={`px-4 py-2 rounded-md ${t.buttonPrimaryBg}`} onPress={onSave}>
          <Text className={`${t.buttonPrimaryText} font-semibold`}>保存</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
