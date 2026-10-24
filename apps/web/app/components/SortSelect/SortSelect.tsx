"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
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

const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

// Upper bound on the whole location wait, permission prompt included
const LOCATION_FALLBACK_MS = 10_000;

// 3 decimals is about 100 m: enough to sort by distance, and it keeps
// the URL short and the exact position private.
const roundCoordinate = (value: number): number =>
  Math.round(value * 1000) / 1000;

function withOrigin(href: string, coords: GeolocationCoordinates): string {
  const url = new URL(href, window.location.origin);
  url.searchParams.set("lat", String(roundCoordinate(coords.latitude)));
  url.searchParams.set("lng", String(roundCoordinate(coords.longitude)));
  return `${url.pathname}${url.search}`;
}

export default function SortSelect({ options, value }: SortSelectProps) {
  const router = useRouter();
  const id = useId();
  const [locating, setLocating] = useState(false);
  // The option the user picked, shown until the new route commits
  const [pendingValue, setPendingValue] = useState<MasterSort | null>(null);
  const [isNavigating, startTransition] = useTransition();
  // Bumped on every location request and on unmount, so a late answer
  // from an older request can't override a newer navigation.
  const requestRef = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      requestRef.current += 1;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    },
    [],
  );

  const busy = locating || isNavigating;

  const navigate = (href: string) =>
    startTransition(() => router.push(href, { scroll: false }));

  // Nearest asks for the browser location. If it's denied, fails or the
  // user ignores the prompt, the page sorts from the city centre instead.
  const selectNearest = (href: string) => {
    if (!("geolocation" in navigator)) {
      navigate(href);
      return;
    }
    const requestId = ++requestRef.current;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    const finish = (target: string) => {
      if (requestRef.current !== requestId) return;
      // Invalidate this request so whichever of the callbacks or the
      // fallback comes second is ignored.
      requestRef.current += 1;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      setLocating(false);
      navigate(target);
    };

    setLocating(true);
    // The geolocation timeout doesn't count time spent on the permission
    // prompt, so cap the whole wait ourselves.
    fallbackTimerRef.current = setTimeout(
      () => finish(href),
      LOCATION_FALLBACK_MS,
    );
    navigator.geolocation.getCurrentPosition(
      (position) => finish(withOrigin(href, position.coords)),
      () => finish(href),
      GEOLOCATION_OPTIONS,
    );
  };

  return (
    <div className={styles.sort}>
      <label htmlFor={id} className={styles.sort__label}>
        Sort by
      </label>
      <select
        id={id}
        className={styles.sort__select}
        value={busy && pendingValue ? pendingValue : value}
        disabled={busy}
        aria-busy={busy}
        onChange={(event) => {
          const option = options.find(
            (candidate) => candidate.value === event.target.value,
          );
          if (!option) return;
          setPendingValue(option.value);
          if (option.value === "nearest") selectNearest(option.href);
          else navigate(option.href);
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
