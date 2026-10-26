import { formatPrice } from "@/lib/format";
import styles from "./BookingBar.module.scss";

type BookingBarProps = {
  minPrice: number;
  currency: string;
  // The first formatted slot, e.g. "Sat 14:00"; null when there are none
  nextSlot: string | null;
};

// Fixed bottom bar below 1024px, in place of the booking card. "Book" has no
// handler: the booking flow is out of scope.
export default function BookingBar({
  minPrice,
  currency,
  nextSlot,
}: BookingBarProps) {
  return (
    <div className={styles.bookingBar}>
      <div className={styles.bookingBar__info}>
        <p className={styles.bookingBar__price}>
          from {formatPrice(minPrice, currency)}
        </p>
        {nextSlot && (
          <p className={styles.bookingBar__slot}>{nextSlot} free</p>
        )}
      </div>
      <button type="button" className={styles.bookingBar__book}>
        Book
      </button>
    </div>
  );
}
