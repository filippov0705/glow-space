import styles from "./Logo.module.scss";
import { Sparkles } from "lucide-react";

interface LogoProps {
  logoSize: "small" | "medium";
}

export default function Logo({ logoSize }: LogoProps) {
  let sparklesSize = 14;
  if (logoSize === "medium") {
    sparklesSize = 20;
  }

  return (
    <div className={`${styles.logo} ${styles[`logo--${logoSize}`]}`}>
      <Sparkles size={sparklesSize} strokeWidth={2} color="#D4537E" />
      <div className={styles.logo__text}>
        <span>glow</span>
        <span className={styles.logo__accent}>space</span>
      </div>
    </div>
  );
}
