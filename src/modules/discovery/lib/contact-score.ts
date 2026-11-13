export type ContactScoreInput = {
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  socials?: string[];
  email?: string | null;
};

/**
 * 0–100 score prioritizing callable / reachable prospects.
 * Phone weighs most, then website, address, socials, email.
 */
export function computeContactScore(input: ContactScoreInput): number {
  let score = 0;
  if (input.phone?.trim()) score += 40;
  if (input.website?.trim()) score += 25;
  if (input.address?.trim()) score += 20;
  if (input.socials && input.socials.length > 0) score += 10;
  if (input.email?.trim()) score += 5;
  return Math.min(100, score);
}
