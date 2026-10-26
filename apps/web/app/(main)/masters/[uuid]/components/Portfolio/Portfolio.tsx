import type { MasterProfileResponse } from "@glow-space/shared";
import styles from "./Portfolio.module.scss";

type PortfolioProps = {
  name: string;
  // Non-empty, at most 6 (capped by the API); the page omits the section
  // when there are no works
  works: MasterProfileResponse["works"];
  worksCount: number;
};

export default function Portfolio({ name, works, worksCount }: PortfolioProps) {
  return (
    <section className={styles.portfolio} aria-labelledby="portfolio-title">
      <div className={styles.portfolio__header}>
        <h2 id="portfolio-title" className={styles.portfolio__title}>
          Portfolio
        </h2>
        {/* The photo gallery is out of scope: the button does nothing */}
        <button type="button" className={styles.portfolio__all}>
          All {worksCount} photos
        </button>
      </div>

      <ul className={styles.portfolio__grid}>
        {works.map((work, index) => (
          <li
            key={`${index}:${work.imageUrl}`}
            className={styles.portfolio__item}
          >
            {/* imageUrl points to arbitrary hosts, so next/image is not used here */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.portfolio__image}
              src={work.imageUrl}
              alt={`Work by ${name}, photo ${index + 1}`}
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
