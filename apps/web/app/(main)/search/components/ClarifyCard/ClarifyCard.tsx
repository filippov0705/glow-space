import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { CategoryResponse } from "@glow-space/shared";
import styles from "./ClarifyCard.module.scss";

type ClarifyCardProps = {
  q: string;
  categories: CategoryResponse[];
  // Label of the day chip from the parser ("Tomorrow", "Saturday", "Weekend")
  day?: string;
};

// "Tomorrow" → "tomorrow", "Saturday" → "on Saturday", "Weekend" → "this weekend"
function dayPhrase(day: string): string {
  if (day === "Today" || day === "Tomorrow") return day.toLowerCase();
  if (day === "Weekend") return "this weekend";
  return `on ${day}`;
}

// The parser found no category
export default function ClarifyCard({ q, categories, day }: ClarifyCardProps) {
  return (
    <section className={styles.card} aria-labelledby="search-clarify-title">
      <h2 id="search-clarify-title" className={styles.card__title}>
        <Sparkles className={styles.card__icon} size={20} aria-hidden="true" />
        What are you looking for?
      </h2>
      <p className={styles.card__text}>
        {day
          ? `Pick a category and we will find masters with free time ${dayPhrase(day)}.`
          : "Pick a category and we will find the right master."}
      </p>

      {categories.length > 0 && (
        <ul className={styles.card__categories}>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={{
                  pathname: "/search",
                  query: { q, category: category.slug },
                }}
                className={styles.card__category}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.card__hint}>
        Or describe it in more detail, for example: &ldquo;haircut and color, up
        to €80&rdquo;
      </p>
    </section>
  );
}
