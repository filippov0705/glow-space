"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type SearchPendingContextValue = {
  pending: boolean;
  setPending: (pending: boolean) => void;
};

const SearchPendingContext = createContext<SearchPendingContextValue | null>(
  null,
);

// Lets a loading fallback keep the SearchBar in its "Searching..." state.
// The SearchBar's own transition ends as soon as React commits the new
// Suspense fallback, long before the results arrive.
export function SearchPendingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);
  return (
    <SearchPendingContext.Provider value={{ pending, setPending }}>
      {children}
    </SearchPendingContext.Provider>
  );
}

// Outside a provider (e.g. the home hero) this is always false
export function useSearchPending(): boolean {
  return useContext(SearchPendingContext)?.pending ?? false;
}

// A live region that stays mounted outside the Suspense boundary, so screen
// readers announce the loading text when it changes. A role="status" on the
// fallback itself arrives with its content already inside and is often
// skipped.
export function SearchPendingStatus({ label }: { label: string }) {
  const pending = useSearchPending();
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {pending ? label : ""}
    </p>
  );
}

// Rendered inside the fallback: marks the search pending while mounted
export function SearchPendingMarker() {
  const setPending = useContext(SearchPendingContext)?.setPending;

  useEffect(() => {
    if (!setPending) return;
    setPending(true);
    return () => setPending(false);
  }, [setPending]);

  return null;
}
