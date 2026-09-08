export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return "--:--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatAlbumDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export function formatDate(iso: string | null, intlLocale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatYear(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).getFullYear().toString();
}

export function formatMonthYear(date: Date, intlLocale: string): string {
  const label = date.toLocaleDateString(intlLocale, { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
