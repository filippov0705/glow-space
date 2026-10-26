import type { MasterProfileResponse } from "@glow-space/shared";
import { experienceLabel } from "../../profile";
import styles from "./About.module.scss";

type AboutProps = Pick<
  MasterProfileResponse,
  "about" | "experienceYears" | "languages"
>;

// Renders nothing when there is no about text, no experience and no
// languages. Languages arrive in sortOrder.
export default function About({
  about,
  experienceYears,
  languages,
}: AboutProps) {
  const pills: string[] = [];
  if (experienceYears !== null) pills.push(experienceLabel(experienceYears));
  if (languages.length > 0) {
    pills.push(languages.map((language) => language.name).join(" · "));
  }
  const text = about?.trim();

  if (!text && pills.length === 0) return null;

  return (
    <section className={styles.about} aria-labelledby="about-title">
      <h2 id="about-title" className={styles.about__title}>
        About
      </h2>
      {text && <p className={styles.about__text}>{text}</p>}
      {pills.length > 0 && (
        <ul className={styles.about__pills}>
          {pills.map((pill) => (
            <li key={pill} className={styles.about__pill}>
              {pill}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
