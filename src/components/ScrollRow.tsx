"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const ARROW = { left: "‹", right: "›" } as const;

export function ScrollRow({ children }: { children: ReactNode }) {
  const t = useTranslations("ScrollRow");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateArrows() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const resizeObserver = new ResizeObserver(updateArrows);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      resizeObserver.disconnect();
    };
  }, [children]);

  function scroll(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label={t("previous")}
          onClick={() => scroll(-1)}
          className="absolute inset-y-0 left-0 z-10 hidden w-14 cursor-pointer items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent text-3xl text-foreground opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 hover:from-background sm:flex"
        >
          {ARROW.left}
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label={t("next")}
          onClick={() => scroll(1)}
          className="absolute inset-y-0 right-0 z-10 hidden w-14 cursor-pointer items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent text-3xl text-foreground opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 hover:from-background sm:flex"
        >
          {ARROW.right}
        </button>
      )}
    </div>
  );
}
