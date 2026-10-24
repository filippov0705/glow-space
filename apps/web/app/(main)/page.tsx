import mastersApi from "@/lib/api/masters";
import CategoriesSection from "../components/CategoriesSection/CategoriesSection";
import TopMastersSection from "../components/TopMastersSection/TopMastersSection";
import MapSection from "../components/MapSection/MapSection";
import SearchHero from "../components/SearchHero/SearchHero";
import { resolveCurrentCity } from "./actions";
import styles from "./page.module.scss";

export default async function HomePage() {
  const city = await resolveCurrentCity();

  const [suggestions, categories, topMasters, mapPoints] = await Promise.all([
    mastersApi.getSearchSuggestions(city.slug),
    mastersApi.getCategories(),
    mastersApi.getTopMasters(city.slug),
    mastersApi.getMapPoints(city.slug),
  ]);

  return (
    <main className={styles.home}>
      <SearchHero suggestions={suggestions} />
      <CategoriesSection categories={categories} />
      <TopMastersSection cityName={city.name} masters={topMasters} />
      <MapSection
        points={mapPoints}
        center={{ lat: city.lat, lng: city.lng }}
      />
    </main>
  );
}
