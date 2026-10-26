import { Injectable } from '@nestjs/common';
import { Booking, ScheduleException, WorkingHours } from 'src/generated/prisma';
import { BLOCKING_STATUSES } from 'src/utils/next-slots';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWorkingHours(masterId: number): Promise<WorkingHours[]> {
    return await this.prisma.workingHours.findMany({
      where: { masterId },
    });
  }

  // Both bounds inclusive; dates are @db.Date values (calendar date at 00:00 UTC).
  async findExceptions(
    masterId: number,
    fromDate: Date,
    toDate: Date,
  ): Promise<ScheduleException[]> {
    return await this.prisma.scheduleException.findMany({
      where: { masterId, date: { gte: fromDate, lte: toDate } },
    });
  }

  // PENDING/CONFIRMED bookings overlapping [start, end), in wall-time encoding.
  async findBlockingBookings(
    masterId: number,
    start: Date,
    end: Date,
  ): Promise<Booking[]> {
    return await this.prisma.booking.findMany({
      where: {
        masterId,
        status: { in: BLOCKING_STATUSES },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
    });
  }
}

export default BookingRepository;
