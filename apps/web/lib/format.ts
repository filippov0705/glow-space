export function formatCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
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
