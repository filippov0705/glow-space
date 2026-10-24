# Responsive category page

Make the category page (`apps/web/app/(main)/categories/[slug]/page.tsx`) adaptive, with the same
breakpoints as the home page (see `responsive-home.md`).

Mockups (attached in the conversation): tablet (~768px) and mobile (390px), each for the list
state and the empty state ("No masters here yet" + "Available in other cities").

Touches only `apps/web`. Header and footer are already adaptive and are not changed.

## Key decisions

- **Breakpoints:** 768px and 480px (`max-width`, inclusive). Replace the old 760/640/560px rules
  on this page with these.
- **Page container** keeps its current paddings (`2rem` above 480px, `1rem` at ≤480px), which
  match the mockups.
- **Masters grid:** 4 columns on desktop, 3 at ≤768px, 2 at ≤480px (gap 10px at ≤480px, as now).
- **Toolbar:**
  - Above 480px: as now, chips wrap, sort select on the right in the same row.
  - ≤480px: chips in one row with native horizontal scroll, no wrapping, scrollbar hidden. The
    sort select goes to its own row below the chips, aligned right. No "8 of 214" counter.
  - The sort dropdown behaves the same as on desktop.
- **Empty state:**
  - Above 480px: as now, buttons side by side.
  - ≤480px: buttons stacked, full width of the card.
- **Other cities:** 3 columns above 480px, 1 column at ≤480px.
- Match the surrounding SCSS module style (BEM-like `&__element`, double quotes in TS).
- Check each step at 1440, 1024, 768, 600, 481, 480 and 390px. The page must never scroll
  horizontally (the chip row scrolls inside itself).

## Steps

1. ✅ **Done.** **List state.** Toolbar and chip scroll in `page.module.scss`, grid columns in
   `MastersGrid.module.scss`.
2. ✅ **Done.** **Empty state.** Stacked full-width buttons in `EmptyState.module.scss`, the 480px breakpoint
   in `OtherCities.module.scss`.
