import { Injectable } from '@nestjs/common';
import BookingRepository from 'src/repository/booking.repository';
import { nextSlots, slotWindow } from 'src/utils/next-slots';

@Injectable()
class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  // Up to three free starts as local ISO strings with no offset.
  async getNextSlots(masterId: number, now: Date): Promise<string[]> {
    const window = slotWindow(now);
    const [workingHours, exceptions, bookings] = await Promise.all([
      this.bookingRepository.findWorkingHours(masterId),
      this.bookingRepository.findExceptions(
        masterId,
        window.firstDate,
        window.lastDate,
      ),
      this.bookingRepository.findBlockingBookings(
        masterId,
        window.start,
        window.end,
      ),
    ]);

    return nextSlots({ now, workingHours, exceptions, bookings });
  }
}

export default BookingService;
