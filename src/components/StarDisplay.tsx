import { useTranslations } from "next-intl";

const STAR = "★";

/** Read-only star rating display, supports half-star increments (0.5 - 5). */
export function StarDisplay({
  rating,
  size = "text-base",
  showValue = false,
}: {
  rating: number | null;
  size?: string;
  showValue?: boolean;
}) {
  const t = useTranslations("StarDisplay");

  if (rating == null) {
    return <span className={`${size} text-muted`}>{t("notRatedYet")}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="relative inline-block text-border" aria-hidden>
        <span>{STAR.repeat(5)}</span>
        <span
          className="absolute inset-0 overflow-hidden text-star"
          style={{ width: `${(rating / 5) * 100}%` }}
        >
          {STAR.repeat(5)}
        </span>
      </span>
      <span className="sr-only">{t("outOf5", { rating })}</span>
      {showValue && <span className="text-muted text-sm">{rating.toFixed(1)}</span>}
    </span>
  );
}
