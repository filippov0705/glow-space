"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { MasterSort } from "@glow-space/shared";
import styles from "./SortSelect.module.scss";

export type SortOption = {
  value: MasterSort;
  label: string;
  href: string;
};

// Options come prebuilt from the server: runtime values from
// @glow-space/shared can't be imported here (its index pulls in bcrypt).
type SortSelectProps = {
  options: SortOption[];
  value: MasterSort;
};

export default function SortSelect({ options, value }: SortSelectProps) {
  const router = useRouter();

  return (
    <div className={styles.sort}>
      <label htmlFor="category-sort" className={styles.sort__label}>
        Sort by
      </label>
      <select
        id="category-sort"
        className={styles.sort__select}
        value={value}
        onChange={(event) => {
          const option = options.find(
            (candidate) => candidate.value === event.target.value,
          );
          if (option) router.push(option.href, { scroll: false });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className={styles.sort__icon} aria-hidden="true" />
    </div>
  );
}
