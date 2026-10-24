# Responsive home page

Make the home page (`apps/web/app/(main)/page.tsx`) adaptive, with the same breakpoints as the
header (see `responsive-header.md`).

Mockups (attached in the conversation): tablet (481–768px) and mobile (≤480px).

Touches only `apps/web`.

## Key decisions

- **Breakpoints:** 1280px, 768px, 480px (`max-width`, inclusive). Replace the old 720px/420px
  rules in the home sections with these.
- **Desktop (>768px)** keeps the current look: categories in 6 columns, top masters in 4.
- **Page container** (`(main)/page.module.scss`):
  - ≤1280px: horizontal padding `1.5rem` (like the header).
  - ≤768px: padding `16px` horizontally.
  - ≤480px: section gap 32px.
- **Categories:**
  - ≤768px: 3 columns.
  - ≤480px: 2 columns.
  - "See all" stays at every width.
- **Top masters:**
  - New "See all" in the section header at every width, styled like the categories "See all"
    (same header row layout). There is no top-masters page yet, so it is a `<button>` with no
    action, like "Top masters" in `MobileMenu`.
  - ≤768px: 2 columns.
  - ≤480px: horizontal carousel instead of the grid. Native horizontal scroll with
    `scroll-snap` (cards snap to the start), scrollbar hidden. A card is about 46% of the
    viewport wide, so about 1.9 cards are visible and it is obvious the row scrolls. The row
    bleeds to the screen edges (negative margin equal to the page padding, the same padding
    inside, and matching `scroll-padding`) so the cut-off card touches the right edge, as in the
    mockup.
- **Section titles:** 20px at ≤480px (24px above).
- **Map:**
  - ≤480px: map height about 200px.
  - ≤480px: clicking a pin does not open the Leaflet popup. Instead the card is docked inside
    the map frame at the bottom (absolute, 10px from the left, right and bottom edges, full
    width, white, rounded 14px, shadow like the popup), above the map pane. Content as in the
    mockup: photo, name, "category · rating (reviews)", and a dark "View" button on the right.
    The button is the existing link to `/masters/{uuid}`. No × button. Tapping the map (not a
    pin) or tapping the active pin again closes the card. The active pin stays highlighted as
    it is now.
  - The popup stays as it is above 480px. If the viewport crosses 480px while a card or popup
    is open, close it.
  - Detect mobile with `matchMedia("(max-width: 480px)")` like `MobileMenu` does. Move that
    query string into `app/constants` and reuse it in both places (with the comment about
    keeping it in sync with the SCSS).
  - Reuse `MapMasterCard` with a variant/prop for the docked layout rather than duplicating
    the markup.
- **Footer** at ≤480px: column layout, copyright first, links below, aligned left.
- Match the surrounding SCSS module style (BEM-like `&__element`, double quotes in TS).
- Check each step at 1440, 1280, 1024, 768, 600, 481, 480 and 390px. The page must never
  scroll horizontally (the carousel scrolls inside itself).

## Steps

1. ✅ **Done.** **Page container, categories, footer.** Breakpoints and paddings in
   `(main)/page.module.scss`, category columns in `CategoriesSection.module.scss`, section title
   size at ≤480px in all three home sections, footer column layout at ≤480px.
2. ✅ **Done.** **Top masters.** "See all" button in `TopMastersSection`, 2 columns at ≤768px, the mobile
   carousel at ≤480px (`TopMastersSection.module.scss`, `MasterCard.module.scss` if needed).
3. ✅ **Done.** **Map on mobile.** Map height at ≤480px, the docked card instead of the popup
   (`MastersMap.tsx`, `MapSection.module.scss`, `MapMasterCard`), the shared mobile query
   constant (also used by `MobileMenu`).
