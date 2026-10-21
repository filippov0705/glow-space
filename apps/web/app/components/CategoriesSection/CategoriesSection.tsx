import Link from "next/link";
import { CategoryResponse } from "@glow-space/shared";
import styles from "./CategoriesSection.module.scss";

type CategoriesSectionProps = {
  categories: CategoryResponse[];
};

export default function CategoriesSection({
  categories,
}: CategoriesSectionProps) {
  return (
    <section className={styles.categories}>
      <div className={styles.categories__header}>
        <h2 className={styles.categories__title}>Categories</h2>
        <Link href="/categories" className={styles.categories__link}>
          See all
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className={styles.categories__empty}>
          No categories available yet.
        </p>
      ) : (
        <ul className={styles.categories__grid}>
          {categories.map((category) => (
            <li key={category.slug} className={styles.categories__item}>
              <Link
                href={`/categories/${category.slug}`}
                className={
                  category.imageUrl
                    ? `${styles.categories__tile} ${styles["categories__tile--image"]}`
                    : styles.categories__tile
                }
              >
                {category.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.categories__image}
                    src={category.imageUrl}
                    alt=""
                  />
                )}
                <span className={styles.categories__name}>
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
