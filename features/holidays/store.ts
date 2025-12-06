import { create } from "zustand";
import { formatLocalDay } from "../../lib/date";
import { getJpHolidaysByDateKey, getJpHolidayRange, type JpHoliday } from "./service";

type State = {
  /** ロード済みの祝日 (メモリキャッシュ)。キーは YYYY-MM-DD。 */
  holidaysByDate: Record<string, JpHoliday[]>;
};

type Actions = {
  /** 指定日の祝日一覧を取得する。 */
  getByDate: (date: Date) => JpHoliday[];
  /** カバーしている年の範囲を取得する。 */
  getRange: () => { startYear: number; endYear: number };
};

export const useHolidayStore = create<State & Actions>()((set, get) => ({
  holidaysByDate: {},

  getByDate: (date) => {
    const key = formatLocalDay(date);
    const cached = get().holidaysByDate[key];
    if (cached) return cached;
    const list = getJpHolidaysByDateKey(key);
    if (list.length === 0) return [];
    set((s) => ({
      holidaysByDate: {
        ...s.holidaysByDate,
        [key]: list,
      },
    }));
    return list;
  },

  getRange: () => getJpHolidayRange(),
}));

