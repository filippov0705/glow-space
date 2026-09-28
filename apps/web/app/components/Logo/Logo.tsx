import styles from "./Logo.module.scss";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className={styles.logo}>
      <Sparkles size={14} strokeWidth={2} color="#D4537E" />
      <div className={styles.logo__text}>
        <span>glow</span>
        <span className={styles.logo__accent}>space</span>
      </div>
    </div>
  );
}
