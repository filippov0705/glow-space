"use client";

import {
  FocusEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Space kept between the open list and the viewport edge
const VIEWPORT_GUTTER = 16;
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import styles from "./CategoryChips.module.scss";

export type ChipItem = {
  key: string;
  name: string;
  href: string;
  active: boolean;
};

type MoreMenuProps = {
  items: ChipItem[];
};

// The "More" chip on desktop: a disclosure button with the categories
// that don't fit in the row. When the active category is one of them,
// the chip is shown as active and named after it.
export default function MoreMenu({ items }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const activeItem = items.find((item) => item.active);

  // The list opens under the button, left-aligned. If that would run past
  // the right edge of the viewport (and cause a horizontal page scroll),
  // align it to the button's right edge instead. The attribute isn't
  // managed by React, so it's set directly before paint.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const button = buttonRef.current;
    if (!open || !menu || !button) return;
    const fitsLeftAligned =
      button.getBoundingClientRect().left + menu.offsetWidth <=
      document.documentElement.clientWidth - VIEWPORT_GUTTER;
    menu.dataset.align = fitsLeftAligned ? "start" : "end";
  }, [open]);

  // Close on a click or tap anywhere outside
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const links = (): HTMLAnchorElement[] =>
    Array.from(rootRef.current?.querySelectorAll("a") ?? []);

  const focusLink = (index: number) => {
    const all = links();
    if (all.length === 0) return;
    all[(index + all.length) % all.length].focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const all = links();
    const current = all.findIndex((link) => link === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    if (!open) {
      // Opening from the button: the list renders on the next commit
      setOpen(true);
      requestAnimationFrame(() => focusLink(step === 1 ? 0 : -1));
      return;
    }
    focusLink(current === -1 ? (step === 1 ? 0 : -1) : current + step);
  };

  // Tabbing out of the button and the list closes it
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !rootRef.current?.contains(event.relatedTarget)
    ) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.chips__more}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.chips__chip} ${styles.chips__moreButton} ${activeItem ? styles["chips__chip--active"] : ""}`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {activeItem ? (
          <>
            {activeItem.name}
            {/* Accessible name: "Nails (current), more categories" */}
            <span className={styles.chips__visuallyHidden}>
              {" "}
              (current), more categories
            </span>
          </>
        ) : (
          "More"
        )}
        <ChevronDown
          className={`${styles.chips__moreIcon} ${open ? styles["chips__moreIcon--open"] : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul ref={menuRef} id={menuId} className={styles.chips__menu}>
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                scroll={false}
                className={`${styles.chips__menuLink} ${item.active ? styles["chips__menuLink--active"] : ""}`}
                aria-current={item.active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
