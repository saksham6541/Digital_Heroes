export type SubscriptionState = "inactive" | "active" | "cancelling" | "lapsed";

export interface SubscriptionProfileLike {
  subscription_status?: string | null;
  subscription_plan?: string | null;
  plan?: string | null;
  current_period_end?: string | Date | null;
  cancel_at_period_end?: boolean | null;
  subscription_renews_at?: string | Date | null;
}

export function isSubscriptionActive(
  profile: SubscriptionProfileLike | null | undefined,
  now: Date = new Date()
): boolean {
  if (!profile) return false;

  const status = profile.subscription_status ?? "inactive";
  const endValue = profile.current_period_end ?? profile.subscription_renews_at ?? null;

  if (status !== "active" || !endValue) return false;

  const end = new Date(endValue);
  return !Number.isNaN(end.getTime()) && end.getTime() > now.getTime();
}

export function getSubscriptionState(
  profile: SubscriptionProfileLike | null | undefined,
  now: Date = new Date()
): SubscriptionState {
  if (!profile) return "inactive";

  const status = profile.subscription_status ?? "inactive";
  const endValue = profile.current_period_end ?? profile.subscription_renews_at ?? null;
  const expiresAt = endValue ? new Date(endValue) : null;
  const isCancelPending = Boolean(profile.cancel_at_period_end);

  if (status === "active" && expiresAt && expiresAt.getTime() > now.getTime()) {
    return isCancelPending ? "cancelling" : "active";
  }

  if (status === "active" || profile.plan || profile.subscription_plan || (expiresAt && expiresAt.getTime() <= now.getTime())) {
    return expiresAt && expiresAt.getTime() <= now.getTime() ? "lapsed" : "inactive";
  }

  return "inactive";
}
