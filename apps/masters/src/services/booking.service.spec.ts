import BookingService from './booking.service';
import BookingRepository from '../repository/booking.repository';
import { Booking, ScheduleException } from 'src/generated/prisma';

describe('BookingService', () => {
  // Monday 2026-10-26, 12:07 in Vilnius (UTC+2 after the DST switch).
  const now = new Date('2026-10-26T10:07:00Z');
  const mondayHours = {
    id: 1,
    masterId: 7,
    weekday: 1,
    startTime: '09:00',
    endTime: '18:00',
  };

  let bookingRepository: {
    findWorkingHours: jest.Mock;
    findExceptions: jest.Mock;
    findBlockingBookings: jest.Mock;
  };
  let service: BookingService;

  beforeEach(() => {
    bookingRepository = {
      findWorkingHours: jest.fn().mockResolvedValue([mondayHours]),
      findExceptions: jest.fn().mockResolvedValue([]),
      findBlockingBookings: jest.fn().mockResolvedValue([]),
    };
    service = new BookingService(
      bookingRepository as unknown as BookingRepository,
    );
  });

  describe('getNextSlots', () => {
    it('queries the 14-day window in Vilnius wall time', async () => {
      await service.getNextSlots(7, now);

      expect(bookingRepository.findWorkingHours).toHaveBeenCalledWith(7);
      expect(bookingRepository.findExceptions).toHaveBeenCalledWith(
        7,
        new Date('2026-10-26T00:00:00Z'),
        new Date('2026-11-09T00:00:00Z'),
      );
      expect(bookingRepository.findBlockingBookings).toHaveBeenCalledWith(
        7,
        new Date('2026-10-26T12:07:00Z'),
        new Date('2026-11-09T12:37:00Z'),
      );
    });

    it('returns the next free starts from working hours', async () => {
      await expect(service.getNextSlots(7, now)).resolves.toEqual([
        '2026-10-26T12:30:00',
        '2026-10-26T13:00:00',
        '2026-10-26T13:30:00',
      ]);
    });

    it('skips starts taken by a loaded booking', async () => {
      bookingRepository.findBlockingBookings.mockResolvedValue([
        {
          startsAt: new Date('2026-10-26T12:30:00Z'),
          endsAt: new Date('2026-10-26T17:30:00Z'),
          status: 'CONFIRMED',
        } as Booking,
      ]);

      await expect(service.getNextSlots(7, now)).resolves.toEqual([
        '2026-10-26T17:30:00',
        '2026-11-02T09:00:00',
        '2026-11-02T09:30:00',
      ]);
    });

    it('blocks the first candidate with a booking that starts before now', async () => {
      bookingRepository.findBlockingBookings.mockResolvedValue([
        {
          startsAt: new Date('2026-10-26T11:30:00Z'),
          endsAt: new Date('2026-10-26T12:45:00Z'),
          status: 'PENDING',
        } as Booking,
      ]);

      await expect(service.getNextSlots(7, now)).resolves.toEqual([
        '2026-10-26T13:00:00',
        '2026-10-26T13:30:00',
        '2026-10-26T14:00:00',
      ]);
    });

    it('uses a loaded exception instead of the weekly hours', async () => {
      bookingRepository.findExceptions.mockResolvedValue([
        {
          date: new Date('2026-10-26T00:00:00Z'),
          isDayOff: false,
          startTime: '15:00',
          endTime: '16:00',
        } as ScheduleException,
      ]);

      await expect(service.getNextSlots(7, now)).resolves.toEqual([
        '2026-10-26T15:00:00',
        '2026-10-26T15:30:00',
        '2026-11-02T09:00:00',
      ]);
    });
  });
});
