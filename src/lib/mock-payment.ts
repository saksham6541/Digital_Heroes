export type MockPlan = "monthly" | "yearly";

export interface CreateSubscriptionInput {
  plan: MockPlan;
  userId: string;
}

export interface MockSubscription {
  id: string;
  plan: MockPlan;
  userId: string;
  status: "pending";
}

export const mockPayment = {
  async createSubscription({ plan, userId }: CreateSubscriptionInput): Promise<MockSubscription> {
    return {
      id: `mock_sub_${crypto.randomUUID()}`,
      plan,
      userId,
      status: "pending",
    };
  },

  verifyWebhookSignature(_payload: string, _signature: string, _secret?: string): boolean {
    void _payload;
    void _signature;
    void _secret;
    return true;
  },
};
