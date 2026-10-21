"use client";

import { useFormStatus } from "react-dom";
import styles from "./OtherCities.module.scss";

type CitySubmitButtonProps = {
  name: string;
  count: string;
};

// Disabled while the parent form's selectCity action is pending.
// Without JS the form still submits natively.
export default function CitySubmitButton({
  name,
  count,
}: CitySubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.cities__card}
      disabled={pending}
      aria-busy={pending}
    >
      <span className={styles.cities__name}>{name}</span>
      <span className={styles.cities__count}>{count}</span>
    </button>
  );
}
