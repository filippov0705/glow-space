import type { CityWithCountResponse } from "@glow-space/shared";
import { formatCount } from "@/lib/format";
import { selectCity } from "../../actions";
import CitySubmitButton from "./CitySubmitButton";
import styles from "./OtherCities.module.scss";

type OtherCitiesProps = {
  cities: CityWithCountResponse[];
};

// Each card is a form: selectCity sets the city cookie and the page
// re-renders for the new city (works without JS too).
export default function OtherCities({ cities }: OtherCitiesProps) {
  if (cities.length === 0) return null;

  return (
    <section className={styles.cities} aria-labelledby="other-cities-title">
      <h2 id="other-cities-title" className={styles.cities__title}>
        Available in other cities
      </h2>
      <ul className={styles.cities__list}>
        {cities.map((city) => (
          <li key={city.slug}>
            <form action={selectCity.bind(null, city.slug)}>
              <CitySubmitButton
                name={city.name}
                count={formatCount(city.mastersCount, "master", "masters")}
              />
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
