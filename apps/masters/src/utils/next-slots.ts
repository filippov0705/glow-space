export const SLOT_TIME_ZONE = 'Europe/Vilnius';
export const SLOT_STEP_MIN = 30;
export const SLOT_LOOKAHEAD_DAYS = 14;
export const SLOT_COUNT = 3;

export type SlotWorkingHours = {
  weekday: number; // ISO: 1 = Monday ... 7 = Sunday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export type SlotException = {
  date: Date; // @db.Date: the calendar date in its UTC fields
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type SlotBookingStatus =
  'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type SlotBooking = {
  startsAt: Date; // @db.Timestamp: local wall time in its UTC fields
  endsAt: Date;
  status: SlotBookingStatus;
};

export type NextSlotsInput = {
  now: Date;
  workingHours: SlotWorkingHours[];
  exceptions: SlotException[];
  bookings: SlotBooking[];
};

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const STEP_MS = SLOT_STEP_MIN * MINUTE_MS;
export const BLOCKING_STATUSES: SlotBookingStatus[] = ['PENDING', 'CONFIRMED'];

type Interval = { start: number; end: number };

const wallFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: SLOT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

// Wall time in Vilnius encoded as a UTC timestamp: its UTC fields are the local
// fields. All the arithmetic below runs on these "wall" timestamps.
function toWallMs(instant: Date): number {
  const parts: Record<string, number> = {};
  for (const part of wallFormatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) + instant.getUTCMilliseconds()
  );
}

export type SlotWindow = {
  start: Date; // Vilnius wall "now" in its UTC fields
  end: Date; // end of the last candidate slot, same encoding
  firstDate: Date; // calendar date of `start` at 00:00 UTC (for @db.Date)
  lastDate: Date; // calendar date of `end` at 00:00 UTC
};

// The range that nextSlots can look at, in the same wall encoding that
// @db.Timestamp and @db.Date columns use, so it can bound Prisma queries.
export function slotWindow(now: Date): SlotWindow {
  const startMs = toWallMs(now);
  const endMs = startMs + SLOT_LOOKAHEAD_DAYS * DAY_MS + STEP_MS;
  return {
    start: new Date(startMs),
    end: new Date(endMs),
    firstDate: new Date(Math.floor(startMs / DAY_MS) * DAY_MS),
    lastDate: new Date(Math.floor(endMs / DAY_MS) * DAY_MS),
  };
}

const parseMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const dateKey = (wallMs: number): string =>
  new Date(wallMs).toISOString().slice(0, 10);

const isoWeekday = (dayStartMs: number): number =>
  new Date(dayStartMs).getUTCDay() || 7;

// Up to three free 30-minute starts within 14 days after `now`, as local ISO strings
// with no offset (`2026-10-31T14:00:00`). A start is free when [start, start + 30min)
// lies inside a working interval of its date and does not overlap a PENDING or
// CONFIRMED booking. An exception replaces the weekly hours of its date.
export function nextSlots({
  now,
  workingHours,
  exceptions,
  bookings,
}: NextSlotsInput): string[] {
  const nowMs = toWallMs(now);
  const limitMs = nowMs + SLOT_LOOKAHEAD_DAYS * DAY_MS;

  const exceptionsByDate = new Map(
    exceptions.map((exception) => [
      dateKey(exception.date.getTime()),
      exception,
    ]),
  );
  const busy: Interval[] = bookings
    .filter((booking) => BLOCKING_STATUSES.includes(booking.status))
    .map((booking) => ({
      start: booking.startsAt.getTime(),
      end: booking.endsAt.getTime(),
    }));

  const intervalsByDay = new Map<number, Interval[]>();
  const intervalsFor = (dayStartMs: number): Interval[] => {
    const cached = intervalsByDay.get(dayStartMs);
    if (cached) return cached;

    const toInterval = (startTime: string, endTime: string): Interval => ({
      start: dayStartMs + parseMinutes(startTime) * MINUTE_MS,
      end: dayStartMs + parseMinutes(endTime) * MINUTE_MS,
    });

    const exception = exceptionsByDate.get(dateKey(dayStartMs));
    let intervals: Interval[];
    if (exception) {
      intervals =
        !exception.isDayOff && exception.startTime && exception.endTime
          ? [toInterval(exception.startTime, exception.endTime)]
          : [];
    } else {
      const weekday = isoWeekday(dayStartMs);
      intervals = workingHours
        .filter((hours) => hours.weekday === weekday)
        .map((hours) => toInterval(hours.startTime, hours.endTime));
    }

    intervalsByDay.set(dayStartMs, intervals);
    return intervals;
  };

  const slots: string[] = [];
  // The next 30-minute mark strictly after now.
  let start = Math.floor(nowMs / STEP_MS) * STEP_MS + STEP_MS;

  for (; start <= limitMs && slots.length < SLOT_COUNT; start += STEP_MS) {
    const end = start + STEP_MS;
    const dayStartMs = Math.floor(start / DAY_MS) * DAY_MS;

    const inWorkingHours = intervalsFor(dayStartMs).some(
      (interval) => interval.start <= start && end <= interval.end,
    );
    if (!inWorkingHours) continue;

    const overlapsBooking = busy.some(
      (booking) => booking.start < end && start < booking.end,
    );
    if (overlapsBooking) continue;

    slots.push(new Date(start).toISOString().slice(0, 19));
  }

  return slots;
}
