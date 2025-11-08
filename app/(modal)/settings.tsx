import { View, Text, Button, TouchableOpacity, TextInput, Keyboard, ScrollView, TouchableWithoutFeedback } from "react-native";
import { router } from "expo-router";
import { useThemeTokens } from "../../features/theme/useTheme";
import { useThemeStore } from "../../features/theme/store";
import { useNotificationStore, PatternKey } from "../../features/notifications/store";
import { useMemo, useState } from "react";

export default function Settings() {
  const { t } = useThemeTokens();
  const flavor = useThemeStore((s) => s.flavor);
  const setFlavor = useThemeStore((s) => s.setFlavor);
  const patterns = useNotificationStore((s) => s.patterns);
  const savePattern = useNotificationStore((s) => s.savePattern);
  const [editing, setEditing] = useState<PatternKey | null>(null);
  const [name, setName] = useState("");
  // 通知タイミング（分）の選択肢（最大5件）
  const [offsetList, setOffsetList] = useState<number[]>([]);
  // カスタム追加用の簡易入力（X時間 Y分）
  const [showCustom, setShowCustom] = useState(false);
  const [customHour, setCustomHour] = useState<string>('0');
  const [customMin, setCustomMin] = useState<string>('5');
  const startEdit = (k: PatternKey) => {
    const p = patterns[k];
    setEditing(k);
    setName(p?.name ?? "");
    setOffsetList([...(p?.offsetsMin ?? [])]);
    setShowCustom(false);
  };
  const commitEdit = () => {
    if (!editing) return;
    savePattern(editing, { name: name || patterns[editing].name, offsetsMin: offsetList });
    setEditing(null);
  };

  // よく使う候補（分単位）
  const QUICK_CHOICES: number[] = useMemo(
    // 3日前/2日前/1日前/12h/6h/3h/2h/1h/45m/30m/15m/10m/5m/3m/1m/0m
    () => [4320, 2880, 1440, 720, 360, 180, 120, 60, 45, 30, 15, 10, 5, 3, 1, 0],
    []
  );

  const formatOffsetLabel = (m: number) => {
    if (m === 0) return '開始時';
    if (m % 1440 === 0) return `${m / 1440}日前`;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      if (mm === 0) return `${h}時間前`;
      return `${h}時間${mm}分前`;
    }
    return `${m}分前`;
  };

  const toggleOffset = (m: number) => {
    setOffsetList((prev) => {
      const exists = prev.includes(m);
      if (exists) return prev.filter((x) => x !== m);
      if (prev.length >= 5) return prev; // 最大5件
      const next = [...prev, m]
        .map((n) => Math.max(0, Math.min(4320, Math.round(n))))
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .sort((a, b) => a - b);
      return next.slice(0, 5);
    });
  };

  const clampInt = (val: string, min: number, max: number) => {
    const num = parseInt(val.replace(/\D+/g, ''), 10);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  };
  const addCustom = () => {
    // X時間 Y分 → 分に変換
    const h = clampInt(customHour, 0, 72);
    const m = clampInt(customMin, 0, 59);
    const minutes = h * 60 + m; // 0〜4320
    toggleOffset(minutes);
    // 入力は保持（連続追加しやすくする）。必要ならクリアする。
    setShowCustom(false);
  };
  return (
    <ScrollView style={{ flex: 1 }} className={`${t.surfaceBg}`} contentContainerClassName="pb-96">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* <Text className={`text-base font-semibold ${t.text}`}>設定</Text> */}

        <View style={{ gap: 8 }}>
          <Text className={`${t.textMuted}`}>テーマ</Text>
          <View className="flex-row gap-4">
            {([
              { key: 'simple', label: 'シンプル' },
              { key: 'mist', label: 'ミスト' },
              { key: 'rose', label: 'ローズ' },
            ] as const).map((opt) => {
              const active = flavor === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setFlavor(opt.key as any)}
                  className={`px-3 py-2 rounded-md border ${t.border} ${active ? t.buttonPrimaryBg : ''}`}
                >
                  <Text className={`${active ? t.buttonPrimaryText : t.text}`}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* アラームパターン */}
        <View style={{ gap: 8 }}>
          <Text className={`${t.textMuted}`}>アラームパターン</Text>
          {(['default', 'A', 'B', 'C'] as PatternKey[]).map((k) => {
            const p = patterns[k];
            const isEditing = editing === k;
            const isDefault = k === 'default';
            return (
              <View key={k} className={`border rounded-md p-3 ${t.border}`} style={{ gap: 8 }}>
                {!isEditing ? (
                  <>
                    <View className="flex-row justify-between items-center">
                      <Text className={`${t.text}`}>{p.name}</Text>
                      {!isDefault && (
                        <TouchableOpacity className={`px-3 py-1 rounded-md ${t.buttonNeutralBg}`} onPress={() => startEdit(k)}>
                          <Text className={`${t.buttonNeutralText}`}>編集</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text className={`${t.textMuted}`}>{p.offsetsMin.length > 0 ? p.offsetsMin.map(formatOffsetLabel).join('、 ') : '-'}</Text>
                  </>
                ) : (
                  <>
                    <View style={{ gap: 6 }}>
                      <Text className={`${t.text}`}>名前</Text>
                      <TextInput value={name} onChangeText={setName} className={`border rounded-md px-3 py-2 ${t.border}`} placeholder="パターン名" />
                    </View>
                    <View style={{ gap: 6 }}>
                      {/* クイックチップ（最大5件） */}
                      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                        {QUICK_CHOICES.map((m) => {
                          const active = offsetList.includes(m);
                          return (
                            <TouchableOpacity
                              key={m}
                              onPress={() => toggleOffset(m)}
                              className={`px-3 py-1 rounded-md border ${t.border} ${active ? t.buttonPrimaryBg : ''}`}
                            >
                              <Text className={`${active ? t.buttonPrimaryText : t.text}`}>{formatOffsetLabel(m)}</Text>
                            </TouchableOpacity>
                          );
                        })}
                        <TouchableOpacity
                          onPress={() => setShowCustom((v) => !v)}
                          className={`px-3 py-1 rounded-md ${t.buttonNeutralBg}`}
                        >
                          <Text className={`${t.buttonNeutralText}`}>＋カスタム</Text>
                        </TouchableOpacity>
                      </View>

                      {/* 区切り線 */}
                      <View className={`h-px w-full ${t.divider} mt-2`} />
                      {/* 選択中の一覧（タップで解除） */}
                      <View className="flex-row flex-wrap mt-2" style={{ gap: 8 }}>
                        {offsetList.length > 0 ? (
                          offsetList.map((m) => (
                            <TouchableOpacity key={m} onPress={() => toggleOffset(m)} className={`px-2 py-1 rounded-md border ${t.border}`}>
                              <Text className={`${t.text}`}>{formatOffsetLabel(m)}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text className={`${t.textMuted}`}>未選択</Text>
                        )}
                      </View>

                      {/* カスタム簡易入力（インライン） */}
                      {showCustom && (
                        <View className={`mt-3 p-3 rounded-md border ${t.border}`} style={{ gap: 8 }}>
                          <Text className={`${t.text}`}>カスタム追加</Text>
                          {/* 入力: X時間 Y分（数値キーボード） */}
                          <View className="flex-row items-center" style={{ gap: 12 }}>
                            <View style={{ minWidth: 80 }}>
                              <Text className={`${t.text}`}>時間</Text>
                              <TextInput
                                keyboardType="number-pad"
                                value={customHour}
                                onChangeText={(s) => setCustomHour(s.replace(/\D+/g, ''))}
                                className={`border rounded-md px-3 py-2 ${t.border}`}
                                placeholder="0"
                                maxLength={3}
                              />
                            </View>
                            <View style={{ minWidth: 80 }}>
                              <Text className={`${t.text}`}>分</Text>
                              <TextInput
                                keyboardType="number-pad"
                                value={customMin}
                                onChangeText={(s) => setCustomMin(s.replace(/\D+/g, ''))}
                                className={`border rounded-md px-3 py-2 ${t.border}`}
                                placeholder="0"
                                maxLength={2}
                              />
                            </View>
                            <TouchableOpacity className={`px-3 py-2 rounded-md ${t.buttonPrimaryBg}`} onPress={addCustom}>
                              <Text className={`${t.buttonPrimaryText}`}>追加</Text>
                            </TouchableOpacity>
                          </View>
                          {/* プレビュー */}
                          <Text className={`${t.textMuted}`}>
                            {(() => {
                              const h = clampInt(customHour, 0, 72);
                              const m = clampInt(customMin, 0, 59);
                              const total = h * 60 + m;
                              const label = h > 0 && m > 0
                                ? `${h}時間${m}分前`
                                : h > 0
                                  ? `${h}時間前`
                                  : m > 0
                                    ? `${m}分前`
                                    : '開始時';
                              return `${label}（合計${total}分）`;
                            })()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row gap-4 justify-end">
                      <TouchableOpacity className={`px-3 py-2 rounded-md ${t.buttonNeutralBg}`} onPress={() => setEditing(null)}>
                        <Text className={`${t.buttonNeutralText}`}>キャンセル</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className={`px-3 py-2 rounded-md ${t.buttonPrimaryBg}`} onPress={commitEdit}>
                        <Text className={`${t.buttonPrimaryText}`}>保存</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>

        <Button title="閉じる" onPress={() => router.back()} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
