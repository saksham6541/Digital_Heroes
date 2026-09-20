// Core draw & prize-pool logic — kept pure/testable (no I/O) so the admin
// route handler and any future test suite can call it directly.

export type MatchTier = 3 | 4 | 5;

export interface PoolShares {
  pool5: number; // 40% — jackpot, rolls over if unclaimed
  pool4: number; // 35%
  pool3: number; // 25%
}

const SHARE_5 = 0.4;
const SHARE_4 = 0.35;

/**
 * Auto-calculates each pool tier from the active subscriber count.
 * `perSubscriberContribution` is the fixed portion of a subscription fee
 * that feeds the prize pool (kept configurable rather than hard-coded so
 * the admin can tune it without a redeploy).
 */
export function calculatePoolShares(
  activeSubscriberCount: number,
  perSubscriberContribution: number,
  rolloverFromPreviousJackpot = 0
): PoolShares & { total: number } {
  const total = Math.round(activeSubscriberCount * perSubscriberContribution * 100) / 100;
  const base5 = Math.round(total * SHARE_5 * 100) / 100;
  const pool4 = Math.round(total * SHARE_4 * 100) / 100;
  const pool3 = Math.round((total - base5 - pool4) * 100) / 100;
  const pool5 = Math.round((base5 + rolloverFromPreviousJackpot) * 100) / 100;
  return {
    total,
    pool5,
    pool4,
    pool3,
  };
}

/** Calculates per-winner prize rounded to 2 decimal places. */
export function calculatePerWinnerPrize(poolAmount: number, winnerCount: number): number {
  if (winnerCount <= 0) return 0;
  return Math.round((poolAmount / winnerCount) * 100) / 100;
}

/** Draws 5 unique numbers between 1 and 45 (standard lottery style). */
export function drawRandomNumbers(count = 5, max = 45): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

/**
 * Algorithmic mode: weight the draw toward numbers that appear more often
 * across all participants' derived numbers (their last-5-scores), so the
 * draw is influenced by aggregate performance rather than pure chance.
 * Falls back to random draw when there isn't enough entry data.
 */
export function drawWeightedNumbers(
  allEntryNumbers: number[][],
  count = 5,
  max = 45
): number[] {
  const freq = new Map<number, number>();
  for (let n = 1; n <= max; n++) freq.set(n, 1); // +1 smoothing so every number stays possible
  for (const entry of allEntryNumbers) {
    for (const n of entry) freq.set(n, (freq.get(n) ?? 1) + 1);
  }

  const weighted: number[] = [];
  for (const [num, weight] of freq.entries()) {
    for (let i = 0; i < weight; i++) weighted.push(num);
  }

  const result = new Set<number>();
  let guard = 0;
  while (result.size < count && guard < 10000) {
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    result.add(pick);
    guard++;
  }
  return Array.from(result).sort((a, b) => a - b);
}

/** Derives a user's 5 "draw numbers" from their last 5 Stableford scores. */
export function numbersFromScores(scores: number[]): number[] {
  // Scores are 1-45 (same range as the draw), so map directly and dedupe.
  const unique = Array.from(new Set(scores)).slice(0, 5);
  while (unique.length < 5) {
    // pad deterministically if the user has fewer than 5 scores on record
    const filler = ((unique.length + 1) * 7) % 45 || 1;
    if (!unique.includes(filler)) unique.push(filler);
  }
  return unique.sort((a, b) => a - b);
}

export function countMatches(entryNumbers: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers);
  return entryNumbers.filter((n) => winSet.has(n)).length;
}

export function tierFromMatchCount(matchCount: number): MatchTier | null {
  if (matchCount >= 5) return 5;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 3;
  return null;
}
