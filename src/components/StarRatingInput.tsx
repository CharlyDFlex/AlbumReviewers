"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const STAR = "★";

/**
 * Clickable 0.5 - 5 star picker. Clicking the left half of a star sets a
 * half-star value, the right half a full-star value (same trick Letterboxd uses).
 */
export function StarRatingInput({
  value,
  onChange,
  size = "text-2xl",
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("StarRatingInput");
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  function valueFromEvent(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? star - 0.5 : star;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${size}`}>
      <span
        className="relative inline-flex"
        onMouseLeave={() => setHover(null)}
      >
        <span className="text-border select-none">{STAR.repeat(5)}</span>
        <span
          className="absolute inset-0 overflow-hidden text-star select-none pointer-events-none"
          style={{ width: `${(shown / 5) * 100}%` }}
        >
          {STAR.repeat(5)}
        </span>
        <span className="absolute inset-0 flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-label={t("rateStars", { count: star })}
              className="flex-1 h-full cursor-pointer disabled:cursor-default"
              onMouseMove={(e) => !disabled && setHover(valueFromEvent(e, star))}
              onClick={(e) => {
                if (disabled) return;
                const next = valueFromEvent(e, star);
                onChange(next === value ? null : next);
              }}
            />
          ))}
        </span>
      </span>
      {value != null && (
        <span className="text-sm text-muted">{value.toFixed(1)}</span>
      )}
      {value != null && !disabled && (
        <button
          type="button"
          className="text-xs text-muted hover:text-danger cursor-pointer"
          onClick={() => onChange(null)}
        >
          {t("clear")}
        </button>
      )}
    </span>
  );
}
