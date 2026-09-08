import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";

// Picks the best supported locale from a raw `Accept-Language` header,
// respecting quality values (e.g. "en-US,fr;q=0.8,en;q=0.5"). We only ever
// look at the primary subtag ("en" out of "en-US") since we don't have
// region-specific message catalogs.
function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const quality = qPart ? parseFloat(qPart) : 1;
      return { tag: tag?.trim().toLowerCase() ?? "", quality };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferences) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const headerList = await headers();
  const locale = pickLocale(headerList.get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
