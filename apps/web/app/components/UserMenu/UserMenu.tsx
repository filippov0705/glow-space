"use client";

import { User, Calendar, Settings, LogOut, ChevronDown } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import styles from "./UserMenu.module.scss";
import { logoutAction } from "./actions";

type Props = {
  name: string;
  email: string;
  initials: string;
};

export function UserMenu({ name, email, initials }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className={styles.userMenu} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.avatar}>{initials}</span>
        <ChevronDown
          size={16}
          className={open ? styles.chevronOpen : styles.chevron}
        />
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.name}>{name}</span>
            <span className={styles.email}>{email}</span>
          </div>

          <button type="button" className={styles.item}>
            <User size={17} className={styles.itemIcon} />
            Profile
          </button>
          <button type="button" className={styles.item}>
            <Calendar size={17} className={styles.itemIcon} />
            My bookings
          </button>
          <button type="button" className={styles.item}>
            <Settings size={17} className={styles.itemIcon} />
            Settings
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={`${styles.item} ${styles.danger}`}
            onClick={logoutAction}
          >
            <LogOut size={17} className={styles.itemIcon} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
