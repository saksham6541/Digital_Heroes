import { calculatePerWinnerPrize, calculatePoolShares } from "../src/lib/draw-engine.ts";

const scenarios = [
  { N: 13, per: 33.33 },
  { N: 3, per: 9.99 },
  { N: 1, per: 0.07 },
];

for (const { N, per } of scenarios) {
  const shares = calculatePoolShares(N, per);
  console.log(`N=${N}, per=${per}:`, JSON.stringify(shares));
}

const total = calculatePoolShares(13, 33.33).total;
const { pool5, pool4, pool3 } = calculatePoolShares(13, 33.33);
console.log(
  "pool5 + pool4 + pool3 === total to the cent:",
  (pool5 + pool4 + pool3).toFixed(2) === total.toFixed(2)
);

console.log("87.5 split 3 ways:", [
  calculatePerWinnerPrize(87.5, 3),
  calculatePerWinnerPrize(87.5, 3),
  calculatePerWinnerPrize(87.5, 3),
]);
