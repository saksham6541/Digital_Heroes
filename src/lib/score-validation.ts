export function validateScoreInput(score: unknown, playedOn: unknown) {
  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 45) {
    return "Score must be an integer between 1 and 45.";
  }
  if (typeof playedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(playedOn)) {
    return "A valid date is required.";
  }
  return null;
}
