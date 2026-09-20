export function getNextMonthlyDraw(now = new Date()) {
  // The next draw is always the first day of the next calendar month.
  const nextDrawDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const period = `${nextDrawDate.getFullYear()}-${String(nextDrawDate.getMonth() + 1).padStart(2, "0")}`;

  return {
    period,
    date: nextDrawDate.toISOString().slice(0, 10),
    label: nextDrawDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
}
