// 週開始=日曜（weekStartsOn=0）の日付ユーティリティ

export const toDate = (input: string | number | Date) => new Date(input);

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Sun..6=Sat（ローカル）
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  return startOfDay(d);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function getMonthMatrix(date: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  // 6行×7列=42セル
  const firstOfMonth = startOfMonth(date);
  const gridStart = startOfWeek(firstOfMonth, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDates(date: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const s = startOfWeek(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export function formatLocalDay(date: Date): string {
  // ローカルTZの日付を YYYY-MM-DD に
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function toUtcIsoString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();
}

export function fromUtcIsoToLocalDate(utcIso: string): Date {
  // ISO はUTCと仮定。表示用途にローカルDateへ（Date型は内部UTCだがgetHours系はローカルで出る）
  return new Date(utcIso);
}

