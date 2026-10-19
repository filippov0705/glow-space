import Link from "next/link";
import styles from "./LegalPage.module.scss";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

type LegalPageProps = {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
  related: { href: string; label: string };
};

export default function LegalPage({
  title,
  updatedAt,
  sections,
  related,
}: LegalPageProps) {
  return (
    <main className={styles.container}>
      <article className={styles.article}>
        <header className={styles.article__header}>
          <h1>{title}</h1>
          <p className={styles.article__updated}>Last updated: {updatedAt}</p>
        </header>

        {sections.map((section, index) => (
          <section key={section.heading} className={styles.article__section}>
            <h2>
              {index + 1}. {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <footer className={styles.article__footer}>
          See also:{" "}
          <Link className={styles.article__link} href={related.href}>
            {related.label}
          </Link>
        </footer>
      </article>
    </main>
  );
}
