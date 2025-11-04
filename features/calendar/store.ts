import { create } from 'zustand';
import { addDays, addMonths, addWeeks } from '../../lib/date';

type ViewMode = 'month' | 'week' | 'day';

type State = {
  currentDate: string; // ISO（ローカルDateから生成してOK）
  view: ViewMode;
};

type Actions = {
  setDate: (d: Date) => void;
  goToday: () => void;
  setView: (v: ViewMode) => void;
  page: (offset: number) => void; // viewに応じてページ送り
};

const toIso = (d: Date) => d.toISOString();

export const useCalendarStore = create<State & Actions>()((set, get) => ({
  currentDate: new Date().toISOString(),
  view: 'month',

  setDate: (d) => set({ currentDate: toIso(d) }),
  goToday: () => set({ currentDate: toIso(new Date()) }),
  setView: (v) => set({ view: v }),
  page: (offset) => {
    const { view, currentDate } = get();
    const d = new Date(currentDate);
    const next = view === 'month' ? addMonths(d, offset) : view === 'week' ? addWeeks(d, offset) : addDays(d, offset);
    set({ currentDate: toIso(next) });
  },
}));

