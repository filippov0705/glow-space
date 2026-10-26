import { Module } from '@nestjs/common';
import BookingRepository from './repository/booking.repository';
import BookingService from './services/booking.service';

@Module({
  providers: [BookingRepository, BookingService],
  exports: [BookingService],
})
export class BookingModule {}
