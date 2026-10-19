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
      <h2 className={styles.categories__title}>Categories</h2>

      {categories.length === 0 ? (
        <p className={styles.categories__empty}>
          No categories available yet.
        </p>
      ) : (
        <ul className={styles.categories__grid}>
          {categories.map((category) => (
            <li key={category.slug} className={styles.categories__tile}>
              <span className={styles.categories__name}>{category.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
