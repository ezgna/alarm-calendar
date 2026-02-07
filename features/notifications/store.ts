// 通知スケジュールの永続化とイベント連動（iOS: カスタムサウンド対応）
// - 既定オフセット（分）での予約/取消/再予約
// - eventId -> notificationIds[] のマッピング

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';
import { initializeNotifications, ensurePermissions, scheduleOnce, cancelMany, listScheduled } from './service';
import type { SoundId } from './sounds';
import { fromUtcIsoToLocalDate } from '../../lib/date';
import { useSubscriptionStore } from '../subscription/store';

// パターンキー
export type PatternKey = 'default' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const PATTERN_KEYS: PatternKey[] = ['default', 'A', 'B', 'C', 'D', 'E', 'F'];
export const CUSTOM_PATTERN_KEYS: PatternKey[] = PATTERN_KEYS.filter((k) => k !== 'default') as PatternKey[];

// パターン定義
export type PatternDef = {
  name: string;
  offsetsMin: number[]; // 0〜4320、最大5件
  registered: boolean; // UI表示のためのフラグ（未登録なら選択不可）
  soundId?: SoundId; // iOS: 通知サウンドID（未指定は 'default'）
};

const FIXED_CUSTOM_PATTERN_KEYS: PatternKey[] = ['A', 'B', 'C'];
const isFixedPatternKey = (key: PatternKey) => FIXED_CUSTOM_PATTERN_KEYS.includes(key);

const FIXED_CUSTOM_PATTERNS: Record<'A' | 'B' | 'C', PatternDef> = {
  A: { name: '大事', offsetsMin: [1440, 60, 30, 5, 0], registered: true, soundId: 'phoneRingtone' },
  B: { name: '普通', offsetsMin: [1440, 60, 5, 0], registered: true, soundId: 'telephoneRingtone' },
  C: { name: 'ゆるめ', offsetsMin: [1440, 60, 5], registered: true, soundId: 'xylophone' },
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
  savePattern: (key: PatternKey, input: { name: string; offsetsMin: number[]; soundId?: SoundId }) => void;
  resetPattern: (key: PatternKey) => void;
  setLastUsedPatternKey: (key: PatternKey) => void;
  setEventPattern: (eventId: string, key: PatternKey) => void;

  // 予約操作
  scheduleForEvent: (event: { id: string; title: string; startAt: string }) => Promise<string[]>; // 互換: defaultを使用
  scheduleForEventWithOffsets: (event: { id: string; title: string; startAt: string }, offsetsMin: number[], soundId?: SoundId) => Promise<string[]>;
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

function normalizePattern(input: PatternDef | undefined, fallback: PatternDef): PatternDef {
  if (!input) return { ...fallback };
  const offsets = Array.isArray(input.offsetsMin) ? clampAndSortOffsets(input.offsetsMin) : fallback.offsetsMin;
  return {
    ...fallback,
    ...input,
    name: input.name ?? fallback.name,
    offsetsMin: offsets,
    registered: typeof input.registered === 'boolean' ? input.registered : fallback.registered,
    soundId: input.soundId ?? fallback.soundId,
  };
}

function defaultPatterns(): Record<PatternKey, PatternDef> {
  return {
    default: { name: 'デフォルト', offsetsMin: [60, 5], registered: true, soundId: 'default' },
    A: { ...FIXED_CUSTOM_PATTERNS.A },
    B: { ...FIXED_CUSTOM_PATTERNS.B },
    C: { ...FIXED_CUSTOM_PATTERNS.C },
    D: { name: 'カスタム4', offsetsMin: [], registered: false, soundId: 'default' },
    E: { name: 'カスタム5', offsetsMin: [], registered: false, soundId: 'default' },
    F: { name: 'カスタム6', offsetsMin: [], registered: false, soundId: 'default' },
  } as const;
}

const DBG = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
const log = (...args: any[]) => {
  if (DBG) {
    console.log('[notif]', ...args);
  }
};

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
        if (isFixedPatternKey(key)) return; // カスタム1〜3は固定
        if (!useSubscriptionStore.getState().isPremium) return; // Premium限定
        const offsets = clampAndSortOffsets(input.offsetsMin);
        set((s) => ({
          patterns: {
            ...s.patterns,
            [key]: {
              name: input.name || s.patterns[key].name,
              offsetsMin: offsets,
              registered: true,
              soundId: input.soundId ?? s.patterns[key].soundId ?? 'default',
            },
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

      scheduleForEventWithOffsets: async (event, offsetsMin, soundId) => {
        initializeNotifications();
        const ok = await ensurePermissions();
        if (!ok) return [];
        const start = fromUtcIsoToLocalDate(event.startAt);
        const now = Date.now();
        const unique = clampAndSortOffsets(offsetsMin);
        log('scheduleForEventWithOffsets', {
          eventId: event.id,
          title: event.title,
          startAtISO: new Date(start.getTime()).toISOString(),
          nowISO: new Date(now).toISOString(),
          input: offsetsMin,
          unique,
        });
        const toSchedule = unique
          .map((m) => ({ m, date: new Date(start.getTime() - m * 60_000) }))
          .filter((x) => x.date.getTime() > now);
        for (const x of toSchedule) {
          log('plan', { offsetMin: x.m, label: formatOffsetLabel(x.m), atISO: x.date.toISOString() });
        }
        const ids: string[] = [];
        for (const x of toSchedule) {
          const label = formatOffsetLabel(x.m);
          const id = await scheduleOnce({ date: x.date, title: event.title, body: label, soundId });
          if (id) ids.push(id);
        }
        log('scheduled ids', ids);
        try {
          const all = await listScheduled();
          log('getAllScheduledNotificationsAsync count', all.length);
        } catch {}
        if (ids.length > 0) set((s) => ({ scheduledByEventId: { ...s.scheduledByEventId, [event.id]: ids } }));
        return ids;
      },

      scheduleForEventWithPattern: async (event, key) => {
        const isPremium = useSubscriptionStore.getState().isPremium;
        const fallback = get().patterns['default'];
        const effectiveKey = isPremium ? key : 'default';
        const pattern = get().patterns[effectiveKey] ?? fallback;
        const offsets = pattern.registered ? pattern.offsetsMin : fallback.offsetsMin;
        const soundId = isPremium ? pattern.soundId ?? 'default' : 'default';
        return await get().scheduleForEventWithOffsets(event, offsets, soundId);
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
        const nextKey = useSubscriptionStore.getState().isPremium ? resolvedKey : 'default';
        return await get().scheduleForEventWithPattern(event, nextKey);
      },
    }),
    {
      name: 'notification-store-v1',
      version: 2,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persistedState, _version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            scheduledByEventId: {},
            patterns: defaultPatterns(),
            lastUsedPatternKey: undefined,
            eventPatternKeyByEventId: {},
          } as State;
        }
        const state = persistedState as State;
        const base = defaultPatterns();
        const prev = (state.patterns ?? {}) as Partial<Record<PatternKey, PatternDef>>;
        const patterns: Record<PatternKey, PatternDef> = {
          default: normalizePattern(prev.default, base.default),
          A: { ...base.A },
          B: { ...base.B },
          C: { ...base.C },
          D: normalizePattern(prev.D, base.D),
          E: normalizePattern(prev.E, base.E),
          F: normalizePattern(prev.F, base.F),
        };
        return {
          scheduledByEventId: state.scheduledByEventId ?? {},
          patterns,
          lastUsedPatternKey: state.lastUsedPatternKey,
          eventPatternKeyByEventId: state.eventPatternKeyByEventId ?? {},
        };
      },
      partialize: (s) => ({
        scheduledByEventId: s.scheduledByEventId,
        patterns: s.patterns,
        lastUsedPatternKey: s.lastUsedPatternKey,
        eventPatternKeyByEventId: s.eventPatternKeyByEventId,
      }),
    }
  )
);
