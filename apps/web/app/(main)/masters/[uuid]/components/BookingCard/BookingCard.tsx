import { formatPrice } from "@/lib/format";
import styles from "./BookingCard.module.scss";

type BookingCardProps = {
  minPrice: number;
  currency: string;
  // Already formatted, e.g. "Sat 14:00"
  slots: string[];
};

// Sticky card beside the sections, shown only at >= 1024px. The booking
// flow is out of scope: the chips and the button have no handler. No slots:
// price and button only.
export default function BookingCard({
  minPrice,
  currency,
  slots,
}: BookingCardProps) {
  return (
    <aside className={styles.bookingCard} aria-label="Booking">
      <p className={styles.bookingCard__price}>
        from {formatPrice(minPrice, currency)}
      </p>

      {slots.length > 0 && (
        <div className={styles.bookingCard__slots}>
          <p id="booking-card-slots" className={styles.bookingCard__label}>
            Next available
          </p>
          <ul
            className={styles.bookingCard__chips}
            aria-labelledby="booking-card-slots"
          >
            {slots.map((slot) => (
              <li key={slot}>
                <button type="button" className={styles.bookingCard__chip}>
                  {slot}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className={styles.bookingCard__book}>
        Book appointment
      </button>
    </aside>
  );
}
