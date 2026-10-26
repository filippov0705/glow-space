// Schedules are local wall-clock time, so "now" is read in the city's zone.
export type LocalNow = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  weekday: number; // ISO: 1 = Monday ... 7 = Sunday
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function localNow(timeZone: string, now: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    weekday: WEEKDAYS.indexOf(part('weekday')) + 1,
  };
}

// Calendar arithmetic on a YYYY-MM-DD date; no timezone is involved.
export function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}
