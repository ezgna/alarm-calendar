// 日本の祝日データ読み込みロジック。
// 現状はローカルにバンドルされた JSON (locales/holidays/jp.json) のみを利用し、
// ネットワーク越しの取得は行わない。

import jp from "../../locales/holidays/jp.json";

export type JpHoliday = {
  date: string;
  name: string;
  year: number;
};

export type JpHolidayMap = {
  country: "JP";
  range: {
    startYear: number;
    endYear: number;
  };
  byDate: Record<string, JpHoliday[]>;
};

const data = jp as JpHolidayMap;

/** 指定日 (YYYY-MM-DD) の祝日一覧を返す。該当なしの場合は空配列。 */
export function getJpHolidaysByDateKey(dateKey: string): JpHoliday[] {
  return data.byDate[dateKey] ?? [];
}

/** カバーしている年の範囲を返す。 */
export function getJpHolidayRange() {
  return data.range;
}

