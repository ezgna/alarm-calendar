// 通知スケジュールの永続化とイベント連動（iOS 既定音のみ）
// - 既定オフセット（分）での予約/取消/再予約
// - eventId -> notificationIds[] のマッピング

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';
import { initializeNotifications, ensurePermissions, scheduleOnce, cancelMany } from './service';
import { fromUtcIsoToLocalDate } from '../../lib/date';

// パターンキー
export type PatternKey = 'default' | 'A' | 'B' | 'C';

// パターン定義
export type PatternDef = {
  name: string;
  offsetsMin: number[]; // 0〜4320、最大5件
  registered: boolean; // UI表示のためのフラグ（未登録なら選択不可）
};

type Mapping = Record<string, string[]>; // eventId -> [notificationId]

type State = {
  scheduledByEventId: Mapping;
  patterns: Record<PatternKey, PatternDef>;
  lastUsedPatternKey?: PatternKey;
  eventPatternKeyByEventId: Record<string, PatternKey>;
};

type Actions = {
  // パターン管理
  savePattern: (key: PatternKey, input: { name: string; offsetsMin: number[] }) => void;
  resetPattern: (key: PatternKey) => void;
  setLastUsedPatternKey: (key: PatternKey) => void;
  setEventPattern: (eventId: string, key: PatternKey) => void;

  // 予約操作
  scheduleForEvent: (event: { id: string; title: string; startAt: string }) => Promise<string[]>; // 互換: defaultを使用
  scheduleForEventWithOffsets: (event: { id: string; title: string; startAt: string }, offsetsMin: number[]) => Promise<string[]>;
  scheduleForEventWithPattern: (event: { id: string; title: string; startAt: string }, key: PatternKey) => Promise<string[]>;
  cancelForEvent: (eventId: string) => Promise<void>;
  rescheduleForEvent: (event: { id: string; title: string; startAt: string }, key?: PatternKey) => Promise<string[]>;
};

function clampAndSortOffsets(offsets: number[]): number[] {
  const normalized = offsets
    .map((n) => Math.max(0, Math.min(4320, Math.round(n))))
    .filter((n, i, arr) => arr.indexOf(n) === i);
  normalized.sort((a, b) => a - b);
  return normalized.slice(-5).length === normalized.length ? normalized : normalized.slice(0, 5);
}

function defaultPatterns(): Record<PatternKey, PatternDef> {
  return {
    default: { name: 'デフォルト', offsetsMin: [60, 5], registered: true },
    A: { name: 'カスタム1', offsetsMin: [], registered: false },
    B: { name: 'カスタム2', offsetsMin: [], registered: false },
    C: { name: 'カスタム3', offsetsMin: [], registered: false },
  } as const;
}

function formatOffsetLabel(m: number): string {
  if (m === 0) return '開始時';
  if (m % 1440 === 0) return `${m / 1440}日前`;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (mm === 0) return `${h}時間前`;
    return `${h}時間${mm}分前`;
  }
  return `${m}分前`;
}

export const useNotificationStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      scheduledByEventId: {},
      patterns: defaultPatterns(),
      lastUsedPatternKey: undefined,
      eventPatternKeyByEventId: {},

      savePattern: (key, input) => {
        if (key === 'default') return; // デフォルトは編集不可
        const offsets = clampAndSortOffsets(input.offsetsMin);
        set((s) => ({
          patterns: {
            ...s.patterns,
            [key]: { name: input.name || s.patterns[key].name, offsetsMin: offsets, registered: true },
          },
        }));
      },

      resetPattern: (key) => {
        if (key === 'default') return; // デフォルトは編集不可
        const base = defaultPatterns()[key];
        set((s) => ({ patterns: { ...s.patterns, [key]: base } }));
      },

      setLastUsedPatternKey: (key) => set({ lastUsedPatternKey: key }),
      setEventPattern: (eventId, key) => set((s) => ({ eventPatternKeyByEventId: { ...s.eventPatternKeyByEventId, [eventId]: key } })),

      scheduleForEvent: async (event) => {
        // 従来互換: default パターン
        return await get().scheduleForEventWithPattern(event, 'default');
      },

      scheduleForEventWithOffsets: async (event, offsetsMin) => {
        initializeNotifications();
        const ok = await ensurePermissions();
        if (!ok) return [];
        const start = fromUtcIsoToLocalDate(event.startAt);
        const now = Date.now();
        const unique = clampAndSortOffsets(offsetsMin);
        const toSchedule = unique
          .map((m) => ({ m, date: new Date(start.getTime() - m * 60_000) }))
          .filter((x) => x.date.getTime() > now);
        const ids: string[] = [];
        for (const x of toSchedule) {
          const label = formatOffsetLabel(x.m);
          const id = await scheduleOnce({ date: x.date, title: event.title, body: label });
          if (id) ids.push(id);
        }
        if (ids.length > 0) set((s) => ({ scheduledByEventId: { ...s.scheduledByEventId, [event.id]: ids } }));
        return ids;
      },

      scheduleForEventWithPattern: async (event, key) => {
        const p = get().patterns[key] ?? get().patterns['default'];
        const offsets = p.registered ? p.offsetsMin : get().patterns['default'].offsetsMin;
        return await get().scheduleForEventWithOffsets(event, offsets);
      },

      cancelForEvent: async (eventId) => {
        const ids = get().scheduledByEventId[eventId] || [];
        if (ids.length > 0) await cancelMany(ids);
        set((s) => {
          const { [eventId]: _omit, ...rest } = s.scheduledByEventId;
          return { scheduledByEventId: rest };
        });
      },

      rescheduleForEvent: async (event, key) => {
        await get().cancelForEvent(event.id);
        const resolvedKey = key ?? get().eventPatternKeyByEventId[event.id] ?? 'default';
        return await get().scheduleForEventWithPattern(event, resolvedKey);
      },
    }),
    {
      name: 'notification-store-v3',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        scheduledByEventId: s.scheduledByEventId,
        patterns: s.patterns,
        lastUsedPatternKey: s.lastUsedPatternKey,
        eventPatternKeyByEventId: s.eventPatternKeyByEventId,
      }),
    }
  )
);
