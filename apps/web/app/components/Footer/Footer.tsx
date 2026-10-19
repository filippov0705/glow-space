import Link from "next/link";
import styles from "./Footer.module.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <span>© {year} glowspace</span>
      <nav className={styles.footer__links}>
        <Link href="/privacy" className={styles.footer__link}>
          Privacy Policy
        </Link>
        <Link href="/terms" className={styles.footer__link}>
          Terms of Use
        </Link>
      </nav>
    </footer>
  );
}
