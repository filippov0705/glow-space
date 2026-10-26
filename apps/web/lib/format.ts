export function formatCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
}

// "Sat 12:00" from a local "2026-10-31T12:00". The value has no timezone, so
// it is read as UTC to keep the weekday and time as they are.
export function formatSlot(slot: string): string {
  const [date, time] = slot.split("T");
  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${weekday} ${time}`;
}

// "€25" for whole amounts, "€25.50" otherwise.
export function formatPrice(cents: number, currency: string): string {
  const digits = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}
