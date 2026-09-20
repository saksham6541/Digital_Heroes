export type PlanId = "monthly" | "yearly";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  priceInr: number;
  periodMonths: number;
  periodLabel: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    priceInr: 499,
    periodMonths: 1,
    periodLabel: "1 month",
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    priceInr: 4999,
    periodMonths: 12,
    periodLabel: "12 months",
  },
};
