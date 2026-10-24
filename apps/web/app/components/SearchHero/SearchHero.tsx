import Link from "next/link";
import { SearchSuggestionResponse } from "@glow-space/shared";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./SearchHero.module.scss";

type SearchHeroProps = {
  suggestions: SearchSuggestionResponse[];
};

export default function SearchHero({ suggestions }: SearchHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="search-hero-title">
      <div className={styles.hero__text}>
        <h1 id="search-hero-title" className={styles.hero__title}>
          Tell us what you need, we will find the master
        </h1>
        <p className={styles.hero__subtitle}>
          <span className={styles["hero__subtitle--desktop"]}>
            Describe it in your own words: service, budget, place and time.
          </span>
          <span className={styles["hero__subtitle--mobile"]}>
            Describe service, budget, place and time.
          </span>
        </p>
      </div>

      <SearchBar />

      {suggestions.length > 0 && (
        <ul className={styles.hero__chips} aria-label="Search suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Link
                href={{ pathname: "/search", query: { q: suggestion.text } }}
                className={styles.hero__chip}
              >
                {suggestion.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
