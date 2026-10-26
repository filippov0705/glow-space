import type { MasterProfileResponse } from "@glow-space/shared";
import { formatPrice } from "@/lib/format";
import styles from "./Services.module.scss";

type ServicesProps = Pick<MasterProfileResponse, "offerings">;

// Active offerings in the response order. The page renders this only when
// there is at least one offering.
export default function Services({ offerings }: ServicesProps) {
  return (
    <section className={styles.services} aria-labelledby="services-title">
      <h2 id="services-title" className={styles.services__title}>
        Services and prices
      </h2>
      <ul className={styles.services__list}>
        {offerings.map((offering) => (
          <li key={offering.id} className={styles.services__item}>
            <div className={styles.services__info}>
              <p className={styles.services__name}>{offering.name}</p>
              <p className={styles.services__duration}>
                {offering.durationMin} min
              </p>
            </div>
            <p className={styles.services__price}>
              {formatPrice(offering.price, offering.currency)}
            </p>
            {/* The booking flow is out of scope: no handler. Shown only at
                >= 1024px. */}
            <button
              type="button"
              className={styles.services__book}
              aria-label={`Book ${offering.name}`}
            >
              Book
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
