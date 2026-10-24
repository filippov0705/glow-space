"use client";

import { FormEvent, useTransition } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useSearchPending } from "./SearchPending";
import styles from "./SearchBar.module.scss";

type SearchBarProps = {
  // Prefills the input, e.g. with the current query on /search
  defaultValue?: string;
  className?: string;
};

const SEARCH_PATH = "/search";

// Submits `q` to /search. next/form navigates via router.push outside a
// React action, so useFormStatus never reports pending; the navigation runs
// in our own transition instead. Without JS the form submits natively.
export default function SearchBar({ defaultValue, className }: SearchBarProps) {
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  // Stays pending while the results fallback is shown (on /search)
  const fallbackShown = useSearchPending();
  const pending = navigating || fallbackShown;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");
    const query = typeof q === "string" ? q.trim() : "";
    if (!query) return;

    startTransition(() => {
      router.push(`${SEARCH_PATH}?${new URLSearchParams({ q: query })}`);
    });
  };

  return (
    <Form
      action={SEARCH_PATH}
      onSubmit={handleSubmit}
      role="search"
      className={`${styles.search} ${className ?? ""}`}
    >
      <div className={styles.search__field}>
        <Sparkles className={styles.search__icon} size={22} aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Describe what you need"
          aria-label="Describe what you need"
          maxLength={300}
          required
          autoComplete="off"
          enterKeyHint="search"
          className={styles.search__input}
        />
      </div>
      <button
        type="submit"
        className={styles.search__button}
        aria-busy={pending}
      >
        {pending ? "Searching..." : "Search"}
      </button>
    </Form>
  );
}
