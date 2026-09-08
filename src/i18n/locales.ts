export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

// BCP-47 tags for Intl.DateTimeFormat / toLocaleDateString, used by
// src/lib/format.ts — keep in sync with LOCALES above.
export const INTL_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
