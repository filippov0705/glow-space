import { Booking, ScheduleException, WorkingHours } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import BookingRepository from './booking.repository';

describe('BookingRepository', () => {
  let workingHoursFindMany: jest.Mock;
  let exceptionFindMany: jest.Mock;
  let bookingFindMany: jest.Mock;
  let repository: BookingRepository;

  beforeEach(() => {
    workingHoursFindMany = jest.fn().mockResolvedValue([]);
    exceptionFindMany = jest.fn().mockResolvedValue([]);
    bookingFindMany = jest.fn().mockResolvedValue([]);
    repository = new BookingRepository({
      workingHours: { findMany: workingHoursFindMany },
      scheduleException: { findMany: exceptionFindMany },
      booking: { findMany: bookingFindMany },
    } as unknown as PrismaService);
  });

  describe('findWorkingHours', () => {
    it('selects the weekly hours of the master', async () => {
      await repository.findWorkingHours(7);

      expect(workingHoursFindMany).toHaveBeenCalledWith({
        where: { masterId: 7 },
      });
    });

    it('returns the bare models', async () => {
      const rows = [{ id: 1, masterId: 7, weekday: 1 }] as WorkingHours[];
      workingHoursFindMany.mockResolvedValue(rows);

      await expect(repository.findWorkingHours(7)).resolves.toBe(rows);
    });
  });

  describe('findExceptions', () => {
    const fromDate = new Date('2026-10-26T00:00:00Z');
    const toDate = new Date('2026-11-09T00:00:00Z');

    it('selects exceptions dated within the range, bounds inclusive', async () => {
      await repository.findExceptions(7, fromDate, toDate);

      expect(exceptionFindMany).toHaveBeenCalledWith({
        where: { masterId: 7, date: { gte: fromDate, lte: toDate } },
      });
    });

    it('returns the bare models', async () => {
      const rows = [{ id: 1, masterId: 7 }] as ScheduleException[];
      exceptionFindMany.mockResolvedValue(rows);

      await expect(
        repository.findExceptions(7, fromDate, toDate),
      ).resolves.toBe(rows);
    });
  });

  describe('findBlockingBookings', () => {
    const start = new Date('2026-10-26T12:07:00Z');
    const end = new Date('2026-11-09T12:37:00Z');

    it('selects PENDING/CONFIRMED bookings overlapping the window', async () => {
      await repository.findBlockingBookings(7, start, end);

      expect(bookingFindMany).toHaveBeenCalledWith({
        where: {
          masterId: 7,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { lt: end },
          endsAt: { gt: start },
        },
      });
    });

    it('returns the bare models', async () => {
      const rows = [{ id: 'b1', masterId: 7 }] as Booking[];
      bookingFindMany.mockResolvedValue(rows);

      await expect(
        repository.findBlockingBookings(7, start, end),
      ).resolves.toBe(rows);
    });
  });
});
