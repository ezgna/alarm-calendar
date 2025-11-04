import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';
import { currentTimeZone, formatLocalDay, fromUtcIsoToLocalDate } from '../../lib/date';

export type EventItem = {
  id: string;
  title: string;
  startAt: string; // UTC ISO
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
      schemaVersion: 1,
      indexByLocalDay: {},
      hydrated: false,
      lastIndexedTz: undefined,

      setHydrated: (v) => set({ hydrated: v }),

      add: (input) => {
        const id = genId();
        set((s) => {
          const eventsById = { ...s.eventsById, [id]: { id, ...input } };
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
          const eventsById = { ...s.eventsById, [id]: { ...cur, ...patch, id } };
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
          const d = fromUtcIsoToLocalDate(e.startAt);
          const key = formatLocalDay(d);
          (map[key] ??= []).push(id);
        }
        // 同日のイベントは開始時刻でソート（UTC→ローカル想定）
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
          const t = new Date(it.startAt).getTime();
          return t >= s && t < e;
        });
      },
    }),
    {
      name: 'event-store-v1',
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

