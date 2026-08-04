export function convertDateForSQL(date: Date): string {
  return date.toISOString();
}
