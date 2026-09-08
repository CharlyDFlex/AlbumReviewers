"use client";

import { useState, useTransition } from "react";
import { StarRatingInput } from "@/components/StarRatingInput";
import { rateAlbum } from "@/app/albums/[id]/actions";

export function AlbumRatingForm({
  albumId,
  initialRating,
  initialReview,
}: {
  albumId: string;
  initialRating: number | null;
  initialReview: string | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [review, setReview] = useState(initialReview ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("albumId", albumId);
    formData.set("rating", rating == null ? "" : String(rating));
    formData.set("review", review);
    startTransition(async () => {
      await rateAlbum(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Ta note</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Écris ta critique..."
        rows={4}
        className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {saved && <span className="text-xs text-accent">Enregistré ✓</span>}
      </div>
    </form>
  );
}
