import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';
import { currentTimeZone, formatLocalDay, fromUtcIsoToLocalDate, startOfDay, addDays, addMinutes } from '../../lib/date';

export type EventItem = {
  id: string;
  title: string;
  startAt: string; // UTC ISO（開始）
  endAt: string; // UTC ISO（終了）
  colorId: string;
  memo?: string;
};

type State = {
  eventsById: Record<string, EventItem>;
  schemaVersion: number;
  indexByLocalDay: Record<string, string[]>; // YYYY-MM-DD -> ids
  hydrated: boolean;
  lastIndexedTz?: string;
};

type Actions = {
  add: (input: Omit<EventItem, 'id'>) => string;
  update: (id: string, patch: Partial<EventItem>) => void;
  remove: (id: string) => void;
  rebuildIndex: (tz?: string) => void;
  getEventsByLocalDay: (date: Date) => EventItem[];
  getEventsInRange: (start: Date, end: Date) => EventItem[];
  setHydrated: (v: boolean) => void;
};

const genId = () => {
  // 簡易UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useEventStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      eventsById: {},
      schemaVersion: 2,
      indexByLocalDay: {},
      hydrated: false,
      lastIndexedTz: undefined,

      setHydrated: (v) => set({ hydrated: v }),

      add: (input) => {
        const id = genId();
        set((s) => {
          let { startAt, endAt } = input;
          if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
            endAt = addMinutes(new Date(startAt), 30).toISOString();
          }
          const eventsById = { ...s.eventsById, [id]: { id, ...input, startAt, endAt } };
          return { eventsById };
        });
        // 差分インデックス更新
        const tz = get().lastIndexedTz ?? currentTimeZone();
        get().rebuildIndex(tz);
        return id;
      },

      update: (id, patch) => {
        set((s) => {
          const cur = s.eventsById[id];
          if (!cur) return {} as State;
          let next: EventItem = { ...cur, ...patch, id } as EventItem;
          if (new Date(next.endAt).getTime() <= new Date(next.startAt).getTime()) {
            next = { ...next, endAt: addMinutes(new Date(next.startAt), 30).toISOString() };
          }
          const eventsById = { ...s.eventsById, [id]: next };
          return { eventsById };
        });
        const tz = get().lastIndexedTz ?? currentTimeZone();
        get().rebuildIndex(tz);
      },

      remove: (id) => {
        set((s) => {
          const { [id]: _omit, ...rest } = s.eventsById;
          return { eventsById: rest };
        });
        const tz = get().lastIndexedTz ?? currentTimeZone();
        get().rebuildIndex(tz);
      },

      rebuildIndex: (tz) => {
        const { eventsById } = get();
        const map: Record<string, string[]> = {};
        for (const id of Object.keys(eventsById)) {
          const e = eventsById[id];
          const ls = fromUtcIsoToLocalDate(e.startAt);
          const le = fromUtcIsoToLocalDate(e.endAt);
          let cur = startOfDay(ls);
          while (cur < le) {
            const key = formatLocalDay(cur);
            (map[key] ??= []).push(id);
            cur = addDays(cur, 1);
          }
        }
        for (const key of Object.keys(map)) {
          map[key].sort((a, b) => {
            const ea = eventsById[a];
            const eb = eventsById[b];
            return new Date(ea.startAt).getTime() - new Date(eb.startAt).getTime();
          });
        }
        set({ indexByLocalDay: map, lastIndexedTz: tz ?? currentTimeZone() });
      },

      getEventsByLocalDay: (date) => {
        const { indexByLocalDay, eventsById } = get();
        const key = formatLocalDay(date);
        const ids = indexByLocalDay[key] || [];
        return ids.map((id) => eventsById[id]);
      },

      getEventsInRange: (start, end) => {
        const { eventsById } = get();
        const s = start.getTime();
        const e = end.getTime();
        return Object.values(eventsById).filter((it) => {
          const st = new Date(it.startAt).getTime();
          const en = new Date(it.endAt).getTime();
          return !(en <= s || st >= e);
        });
      },
    }),
    {
      // 完全やり直し前提。キーも更新して古いデータと分離
      name: 'event-store-v2',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ eventsById: s.eventsById, schemaVersion: s.schemaVersion }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        // 復元後にインデックス再構築
        requestAnimationFrame(() => {
          try {
            state?.rebuildIndex(currentTimeZone());
          } catch {}
        });
      },
    }
  )
);
