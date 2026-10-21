// Category, subcategory and city slugs: lowercase letters, digits and dashes
export function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]+$/.test(value);
}
