import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SearchBar from "@/app/components/SearchBar/SearchBar";
import {
  SearchPendingProvider,
  SearchPendingStatus,
} from "@/app/components/SearchBar/SearchPending";
import SearchResults from "./components/SearchResults/SearchResults";
import SearchSkeleton from "./components/SearchSkeleton/SearchSkeleton";
import { parseSearchParams, searchHref } from "./query";
import styles from "./page.module.scss";

export async function generateMetadata(
  props: PageProps<"/search">,
): Promise<Metadata> {
  const params = parseSearchParams(await props.searchParams);
  return {
    title: params ? `${params.q} · Search · GlowSpace` : "Search · GlowSpace",
    description: "Beauty masters matching your request",
  };
}

// The search bar renders right away; the results are a separate async
// component so they can be wrapped in Suspense.
export default async function SearchPage(props: PageProps<"/search">) {
  const params = parseSearchParams(await props.searchParams);
  if (!params) redirect("/");

  return (
    <main className={styles.page}>
      <h1 className="sr-only">Search results for {params.q}</h1>
      {/* The skeleton keeps the search button on "Searching..." */}
      <SearchPendingProvider>
        {/* Keyed by q: the input is uncontrolled, so a new query remounts it */}
        <SearchBar key={params.q} defaultValue={params.q} />
        {/* Outside the boundary so the live region stays mounted */}
        <SearchPendingStatus label="Understanding your request" />
        {/* Keyed by the canonical URL: a new boundary per search, so the
            skeleton shows on every new search, not only on the first load */}
        <Suspense key={searchHref(params)} fallback={<SearchSkeleton />}>
          <SearchResults params={params} />
        </Suspense>
      </SearchPendingProvider>
    </main>
  );
}
