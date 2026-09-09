import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Requirements to request the 'discjockey' role — see src/app/cgu for the
// user-facing rules. Kept together so both sides of the eligibility check
// (profile page gate, request server action) can't drift apart.
export const DISCJOCKEY_MIN_ACCOUNT_AGE_DAYS = 60;
export const DISCJOCKEY_MIN_REVIEWS = 5;

export type DiscjockeyEligibility = {
  accountAgeMet: boolean;
  reviewsCount: number;
  reviewsMet: boolean;
  eligible: boolean;
};

export async function getDiscjockeyEligibility(
  supabase: SupabaseClient<Database>,
  userId: string,
  profileCreatedAt: string,
): Promise<DiscjockeyEligibility> {
  const accountAgeMs = Date.now() - new Date(profileCreatedAt).getTime();
  const accountAgeMet = accountAgeMs >= DISCJOCKEY_MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000;

  const { count } = await supabase
    .from("album_ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("review", "is", null);

  const reviewsCount = count ?? 0;
  const reviewsMet = reviewsCount >= DISCJOCKEY_MIN_REVIEWS;

  return { accountAgeMet, reviewsCount, reviewsMet, eligible: accountAgeMet && reviewsMet };
}
