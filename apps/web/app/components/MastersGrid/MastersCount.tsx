"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import styles from "./MastersCount.module.scss";

type Count = { shown: number; total: number };

type MastersCountValue = Count & {
  setCount: (count: Count) => void;
};

const MastersCountContext = createContext<MastersCountValue | null>(null);

type MastersCountProviderProps = Count & {
  children: ReactNode;
};

// Shares "shown of total" between MastersGrid, which appends pages, and
// the counter in the toolbar above it. Give it a key built from the
// filters so a new list starts from the server counts.
export function MastersCountProvider({
  shown,
  total,
  children,
}: MastersCountProviderProps) {
  const [count, setCount] = useState<Count>({ shown, total });

  return (
    <MastersCountContext value={{ ...count, setCount }}>
      {children}
    </MastersCountContext>
  );
}

// null outside a provider: the grid then just doesn't report its count
export function useMastersCount(): MastersCountValue | null {
  return useContext(MastersCountContext);
}

// "8 of 214". Only shown on mobile, next to the sort select.
export default function MastersCount() {
  const count = useMastersCount();
  if (!count) return null;

  return (
    <p className={styles.count}>
      {count.shown.toLocaleString("en-US")} of{" "}
      {count.total.toLocaleString("en-US")}
    </p>
  );
}
