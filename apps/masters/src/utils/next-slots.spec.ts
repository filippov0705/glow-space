import {
  nextSlots,
  NextSlotsInput,
  SlotBooking,
  SlotBookingStatus,
  SlotException,
  SlotWorkingHours,
} from './next-slots';

// Vilnius is UTC+2 in November 2026. 2026-11-02 is a Monday.
const vilnius = (local: string): Date => new Date(`${local}+02:00`);
// Prisma returns @db.Date and @db.Timestamp values with the stored wall time in UTC fields.
const wall = (local: string): Date => new Date(`${local}Z`);

const weekdays = (
  startTime: string,
  endTime: string,
  days = [1, 2, 3, 4, 5],
): SlotWorkingHours[] =>
  days.map((weekday) => ({ weekday, startTime, endTime }));

const booking = (
  startsAt: string,
  endsAt: string,
  status: SlotBookingStatus,
): SlotBooking => ({ startsAt: wall(startsAt), endsAt: wall(endsAt), status });

const dayOff = (date: string): SlotException => ({
  date: wall(`${date}T00:00:00`),
  isDayOff: true,
  startTime: null,
  endTime: null,
});

const special = (
  date: string,
  startTime: string,
  endTime: string,
): SlotException => ({
  date: wall(`${date}T00:00:00`),
  isDayOff: false,
  startTime,
  endTime,
});

const run = (input: Partial<NextSlotsInput> & { now: Date }): string[] =>
  nextSlots({ workingHours: [], exceptions: [], bookings: [], ...input });

describe('nextSlots', () => {
  it('returns the next three starts as local ISO strings without offset', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
      }),
    ).toEqual([
      '2026-11-02T09:00:00',
      '2026-11-02T09:30:00',
      '2026-11-02T10:00:00',
    ]);
  });

  it('uses Europe/Vilnius wall time for now', () => {
    // 07:10 UTC is 09:10 in Vilnius.
    expect(
      run({
        now: new Date('2026-11-02T07:10:00Z'),
        workingHours: weekdays('09:00', '18:00'),
      }),
    ).toEqual([
      '2026-11-02T09:30:00',
      '2026-11-02T10:00:00',
      '2026-11-02T10:30:00',
    ]);
  });

  it('skips a lunch gap between two intervals', () => {
    expect(
      run({
        now: vilnius('2026-11-02T11:10:00'),
        workingHours: [
          ...weekdays('09:00', '12:00'),
          ...weekdays('13:00', '18:00'),
        ],
      }),
    ).toEqual([
      '2026-11-02T11:30:00',
      '2026-11-02T13:00:00',
      '2026-11-02T13:30:00',
    ]);
  });

  it('does not start a slot that would end after the interval', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:00:00'),
        workingHours: weekdays('09:00', '10:15'),
      }),
    ).toEqual([
      '2026-11-02T09:00:00',
      '2026-11-02T09:30:00',
      '2026-11-03T09:00:00',
    ]);
  });

  it('skips a day off exception', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
        exceptions: [dayOff('2026-11-02')],
      }),
    ).toEqual([
      '2026-11-03T09:00:00',
      '2026-11-03T09:30:00',
      '2026-11-03T10:00:00',
    ]);
  });

  it('replaces the weekly hours with a special interval', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
        exceptions: [special('2026-11-02', '15:00', '16:30')],
      }),
    ).toEqual([
      '2026-11-02T15:00:00',
      '2026-11-02T15:30:00',
      '2026-11-02T16:00:00',
    ]);
  });

  it('opens a special interval on a day without weekly hours', () => {
    // 2026-11-08 is a Sunday.
    expect(
      run({
        now: vilnius('2026-11-07T20:00:00'),
        workingHours: weekdays('09:00', '18:00'),
        exceptions: [special('2026-11-08', '10:00', '11:00')],
      }),
    ).toEqual([
      '2026-11-08T10:00:00',
      '2026-11-08T10:30:00',
      '2026-11-09T09:00:00',
    ]);
  });

  it('maps ISO weekday 7 to Sunday', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:00:00'),
        workingHours: weekdays('12:00', '13:00', [7]),
      }),
    ).toEqual([
      '2026-11-08T12:00:00',
      '2026-11-08T12:30:00',
      '2026-11-15T12:00:00',
    ]);
  });

  it('skips starts that overlap pending or confirmed bookings', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
        bookings: [
          booking('2026-11-02T09:00:00', '2026-11-02T09:45:00', 'PENDING'),
          booking('2026-11-02T10:00:00', '2026-11-02T10:30:00', 'CONFIRMED'),
        ],
      }),
    ).toEqual([
      '2026-11-02T10:30:00',
      '2026-11-02T11:00:00',
      '2026-11-02T11:30:00',
    ]);
  });

  it('blocks a start when a booking begins inside the slot', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
        bookings: [
          booking('2026-11-02T09:15:00', '2026-11-02T09:30:00', 'CONFIRMED'),
        ],
      }),
    ).toEqual([
      '2026-11-02T09:30:00',
      '2026-11-02T10:00:00',
      '2026-11-02T10:30:00',
    ]);
  });

  it('ignores cancelled and completed bookings', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        workingHours: weekdays('09:00', '18:00'),
        bookings: [
          booking('2026-11-02T09:00:00', '2026-11-02T10:00:00', 'CANCELLED'),
          booking('2026-11-02T10:00:00', '2026-11-02T10:30:00', 'COMPLETED'),
        ],
      }),
    ).toEqual([
      '2026-11-02T09:00:00',
      '2026-11-02T09:30:00',
      '2026-11-02T10:00:00',
    ]);
  });

  it('starts strictly after now when now is exactly on a 30-minute mark', () => {
    expect(
      run({
        now: vilnius('2026-11-02T09:00:00'),
        workingHours: weekdays('09:00', '18:00'),
      }),
    ).toEqual([
      '2026-11-02T09:30:00',
      '2026-11-02T10:00:00',
      '2026-11-02T10:30:00',
    ]);
  });

  it('rounds up to the next mark a moment before it', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:59:59.999'),
        workingHours: weekdays('09:00', '18:00'),
      })[0],
    ).toBe('2026-11-02T09:00:00');
  });

  it('returns fewer than three slots when only that many are free', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        exceptions: [special('2026-11-05', '09:00', '10:00')],
      }),
    ).toEqual(['2026-11-05T09:00:00', '2026-11-05T09:30:00']);
  });

  it('returns no slots when nothing is free within 14 days', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:10:00'),
        exceptions: [special('2026-11-17', '09:00', '18:00')],
      }),
    ).toEqual([]);
  });

  it('includes a start exactly 14 days after now and nothing later', () => {
    expect(
      run({
        now: vilnius('2026-11-02T08:00:00'),
        exceptions: [special('2026-11-16', '08:00', '09:00')],
      }),
    ).toEqual(['2026-11-16T08:00:00']);
  });

  it('handles the fall-back DST switch on 2026-10-25', () => {
    // 00:30 UTC (UTC+3) and 01:30 UTC (UTC+2) are both 03:30 in Vilnius.
    const workingHours = weekdays('00:00', '23:00', [7]);
    for (const now of [
      new Date('2026-10-25T00:30:00Z'),
      new Date('2026-10-25T01:30:00Z'),
    ]) {
      expect(run({ now, workingHours })[0]).toBe('2026-10-25T04:00:00');
    }
  });

  it('handles the spring-forward DST switch on 2026-03-29', () => {
    // 01:00 UTC is 04:00 in Vilnius, right after the jump from 03:00.
    expect(
      run({
        now: new Date('2026-03-29T01:00:00Z'),
        workingHours: weekdays('00:00', '23:00', [7]),
      })[0],
    ).toBe('2026-03-29T04:30:00');
  });

  it('returns no slots without any working hours', () => {
    expect(run({ now: vilnius('2026-11-02T08:10:00') })).toEqual([]);
  });
});
