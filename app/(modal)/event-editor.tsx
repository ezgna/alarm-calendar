import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import ColorPicker from "../../components/common/ColorPicker";
import { getColorHex } from "../../components/common/colorVariants";
import { useEventStore } from "../../features/events/store";
import { getPatternTextColor, getPatternTint, patternKeyToColorId } from "../../features/notifications/patternColors";
import { SOUND_OPTIONS, type SoundId } from "../../features/notifications/sounds";
import { CUSTOM_PATTERN_KEYS, PATTERN_KEYS, PatternKey, useNotificationStore } from "../../features/notifications/store";
import { useSubscriptionStore } from "../../features/subscription/store";
import { useThemeTokens } from "../../features/theme/useTheme";
import { addMinutes, fromUtcIsoToLocalDate, toUtcIsoString } from "../../lib/date";

export default function EventEditor() {
  const { t } = useThemeTokens();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const initialDateStr = typeof params.date === "string" ? params.date : undefined;

  const getById = useEventStore((s) => s.eventsById);
  const add = useEventStore((s) => s.add);
  const update = useEventStore((s) => s.update);
  const remove = useEventStore((s) => s.remove);
  const patterns = useNotificationStore((s) => s.patterns);
  const lastUsedPatternKey = useNotificationStore((s) => s.lastUsedPatternKey);
  const eventPatternKeyByEventId = useNotificationStore((s) => s.eventPatternKeyByEventId);
  const rawIsPremium = useSubscriptionStore((s) => s.isPremium);
  const isSubscriptionDisabled = Platform.OS === "android";
  const isPremium = isSubscriptionDisabled ? false : rawIsPremium;

  const existing = id ? getById[id] : undefined;
  const isEdit = !!id; // 画面ヘッダーは ID の有無で判定（ストアの読込待ちによるチラつきを防ぐ）

  const [title, setTitle] = useState(existing?.title ?? "");
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [start, setStart] = useState<Date>(() => {
    if (existing) return fromUtcIsoToLocalDate(existing.startAt);
    if (initialDateStr) return new Date(initialDateStr);
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [end, setEnd] = useState<Date>(() => {
    if (existing?.endAt) return fromUtcIsoToLocalDate(existing.endAt);
    return addMinutes(existing ? fromUtcIsoToLocalDate(existing.startAt) : initialDateStr ? new Date(initialDateStr) : new Date(), 30);
  });
  const isIos = Platform.OS === "ios";

  // アラームパターン（登録済みのみ選択可能）。新規作成時は「タイミングが1件もないカスタム」は非表示。
  const isUsableForNew = (k: PatternKey) => {
    if (k === "default") return true;
    const p = patterns[k];
    return !!(p && p.registered && (p.offsetsMin?.length ?? 0) > 0);
  };
  const resolveInitialPatternKey = (): PatternKey => {
    if (!isPremium) return "default";
    if (existing) {
      return (eventPatternKeyByEventId[existing.id] as PatternKey) || "default";
    }
    if (lastUsedPatternKey && isUsableForNew(lastUsedPatternKey as PatternKey)) {
      return lastUsedPatternKey as PatternKey;
    }
    return "default";
  };

  const initialPatternKey = resolveInitialPatternKey();
  const [patternKey, setPatternKey] = useState<PatternKey>(initialPatternKey);
  const [colorId, setColorId] = useState(existing?.colorId ?? patternKeyToColorId(initialPatternKey));

  useEffect(() => {
    if (!isPremium) {
      setPatternKey("default");
    }
  }, [isPremium]);

  // 新規作成時のみ、パターン変更に追従してカテゴリ色を自動設定
  useEffect(() => {
    if (!isEdit) {
      setColorId(patternKeyToColorId(patternKey));
    }
  }, [isEdit, patternKey]);

  const formatDateTimeLabel = (date: Date) =>
    date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  // 表示用ラベル（設定画面と同等の見え方）
  const formatOffsetLabel = (m: number) => {
    if (m === 0) return "開始時";
    if (m % 1440 === 0) return `${m / 1440}日前`;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      if (mm === 0) return `${h}時間前`;
      return `${h}時間${mm}分前`;
    }
    return `${m}分前`;
  };

  const openAndroidDateTimePicker = (target: "start" | "end") => {
    if (isIos) return;
    const current = target === "start" ? start : end;
    DateTimePickerAndroid.open({
      value: current,
      mode: "date",
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== "set" || !selectedDate) return;
        const pickedDate = new Date(selectedDate);
        DateTimePickerAndroid.open({
          value: current,
          mode: "time",
          is24Hour: true,
          onChange: (eventTime, selectedTime) => {
            if (eventTime.type !== "set" || !selectedTime) return;
            const next = new Date(pickedDate);
            next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            if (target === "start") {
              setStart(next);
              if (end <= next) setEnd(addMinutes(next, 30));
            } else {
              if (next <= start) setEnd(addMinutes(start, 30));
              else setEnd(next);
            }
          },
        });
      },
    });
  };

  const onSave = () => {
    if (!title.trim()) return; // タイトル必須
    const startIso = toUtcIsoString(start);
    const endIso = toUtcIsoString(end <= start ? addMinutes(start, 30) : end);
    if (existing) {
      update(existing.id, { title: title.trim(), colorId, memo, startAt: startIso, endAt: endIso }, { patternKey });
    } else {
      add({ title: title.trim(), colorId, memo, startAt: startIso, endAt: endIso }, { patternKey });
    }
    router.back();
  };

  const getSoundLabel = (soundId?: SoundId) => {
    const opt = SOUND_OPTIONS.find((o) => o.id === (soundId ?? "default"));
    return opt?.label ?? "デフォルト";
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert("削除の確認", "この予定を削除します。元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          try {
            remove(existing.id);
          } finally {
            router.back();
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* ヘッダータイトル：新規作成 or 編集 を動的に切替 */}
      <Stack.Screen options={{ headerTitle: isEdit ? "編集" : "新規作成" }} />
      <ScrollView className={`flex-1 p-4 ${t.surfaceBg}`} contentContainerStyle={{ gap: 16 }}>
        <View className="gap-2">
          <Text className={`text-sm ${t.textMuted}`}>タイトル（必須）</Text>
          <TextInput className={`border rounded-md px-3 py-2 ${t.border}`} placeholder="タイトル" value={title} onChangeText={setTitle} />
        </View>

        <View className="gap-2">
          <Text className={`text-sm ${t.textMuted}`}>開始日時</Text>
          {!isIos ? (
            <View className="flex-row gap-2">
              <TouchableOpacity className={`px-3 py-2 rounded-md ${t.buttonNeutralBg}`} onPress={() => openAndroidDateTimePicker("start")}>
                <Text>{formatDateTimeLabel(start)}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {isIos && (
            <DateTimePicker
              value={start}
              mode="datetime"
              onChange={(_, d) => {
                if (d) {
                  setStart(d);
                  if (end <= d) setEnd(addMinutes(d, 30));
                }
              }}
            />
          )}
        </View>

        {/*
          終了日時フィールド（将来再度表示したくなったらこのブロックのコメントを解除）
        <View className="gap-2">
          <Text className={`text-sm ${t.textMuted}`}>終了日時</Text>
          {!isIos ? (
            <View className="flex-row gap-2">
              <TouchableOpacity className={`px-3 py-2 rounded-md ${t.buttonNeutralBg}`} onPress={() => openAndroidDateTimePicker("end")}>
                <Text>{formatDateTimeLabel(end)}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {isIos && (
            <DateTimePicker
              value={end}
              mode="datetime"
              onChange={(_, d) => {
                if (d) {
                  if (d <= start) setEnd(addMinutes(start, 30));
                  else setEnd(d);
                }
              }}
            />
          )}
        </View>
        */}

        {isEdit && (
          <View className="gap-2">
            <Text className={`text-sm ${t.textMuted}`}>カテゴリ色</Text>
            <ColorPicker value={colorId} onChange={setColorId} />
          </View>
        )}

        {/* アラームパターン選択 */}
        <View className="gap-2">
          <Text className={`text-sm ${t.textMuted}`}>アラームパターン</Text>
          <View className="flex-row flex-wrap gap-2">
            {(isPremium ? PATTERN_KEYS.filter((k) => isUsableForNew(k)) : (['default'] as PatternKey[])).map((k) => {
              const p = patterns[k];
              const registered = p?.registered;
              const usable = existing ? !!registered : isUsableForNew(k);
              const active = patternKey === k && usable;
              const tint = getPatternTint(k);
              const bg = tint?.bg ?? 'rgba(15, 23, 42, 0.04)';
              const activeBg = tint ? tint.bg : 'rgba(37, 99, 235, 0.12)';
              const border = tint?.border ?? '#e5e7eb';
              const textColor = active ? getPatternTextColor(k) : '#0f172a';
              return (
                <TouchableOpacity
                  key={k}
                  disabled={!usable}
                  onPress={() => usable && setPatternKey(k)}
                  className={`px-3 py-2 rounded-md border`}
                  style={{
                    borderColor: border,
                    backgroundColor: active ? activeBg : bg,
                    opacity: usable ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: textColor, fontWeight: active ? '700' : '500' }}>{p?.name ?? k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* 選択中パターンの内訳（チップ表示） */}
          <View className="mt-1">
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              <View
                className="px-2 py-1 rounded-md"
                style={{ borderWidth: 1, borderColor: '#cbd5e1' }}
              >
                <Text className={`${t.text}`}>{getSoundLabel(patterns[patternKey]?.soundId)}</Text>
              </View>
            </View>
            <View className="h-2" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {(patterns[patternKey]?.offsetsMin?.length ?? 0) > 0 ? (
                patterns[patternKey]!.offsetsMin.map((m) => (
                  <View key={m} className={`px-2 py-1 rounded-md border ${t.border}`}>
                    <Text className={`${t.text}`}>{formatOffsetLabel(m)}</Text>
                  </View>
                ))
              ) : (
                <Text className={`${t.textMuted}`}>未設定</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            className={`self-start mt-1 px-3 py-2 rounded-md`}
            onPress={() => router.push("/(modal)/settings")}
            style={{
              backgroundColor: getColorHex(patternKeyToColorId(patternKey)).bg,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <Text style={{ color: '#0f172a' }}>アラームパターンを編集</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-2">
          <Text className={`text-sm ${t.textMuted}`}>メモ</Text>
          <TextInput
            className={`border rounded-md px-3 py-2 h-24 ${t.border}`}
            style={{ textAlignVertical: "top" }}
            placeholder="メモを入力"
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
    </>
  );
}
