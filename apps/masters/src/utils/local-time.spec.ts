import { addDays, localNow } from './local-time';

describe('localNow', () => {
  it('reads the date, time and ISO weekday in the given zone', () => {
    // Friday 23:30 UTC is already Saturday 02:30 in Vilnius (EEST, +03:00).
    const now = new Date('2026-10-23T23:30:00Z');

    expect(localNow('Europe/Vilnius', now)).toEqual({
      date: '2026-10-24',
      time: '02:30',
      weekday: 6,
    });
    expect(localNow('America/New_York', now)).toEqual({
      date: '2026-10-23',
      time: '19:30',
      weekday: 5,
    });
  });

  it('returns 00 for midnight, not 24', () => {
    expect(
      localNow('Europe/Vilnius', new Date('2026-10-25T22:00:00Z')).time,
    ).toBe('00:00');
  });
});

describe('addDays', () => {
  it('moves across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-24', 0)).toBe('2026-10-24');
  });
});
