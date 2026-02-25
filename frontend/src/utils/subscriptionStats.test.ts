import { describe, it, expect } from 'vitest';
import { calculateSubscriptionStats } from './subscriptionStats';
import { Subscription } from '../types';

describe('calculateSubscriptionStats', () => {
  it('correctly calculates statistics', () => {
    const subscriptions: Partial<Subscription>[] = [
      { id: 1, status: 'active', monthly_fee: 100 },
      { id: 2, status: 'active', monthly_fee: 200 },
      { id: 3, status: 'pending', monthly_fee: 150 },
      { id: 4, status: 'suspended', monthly_fee: 120 },
      { id: 5, status: 'cancelled', monthly_fee: 50 },
    ] as any;

    const stats = calculateSubscriptionStats(subscriptions as Subscription[]);

    expect(stats.active).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.suspended).toBe(1);
    expect(stats.revenue).toBe(300);
  });

  it('handles empty array', () => {
    const stats = calculateSubscriptionStats([]);
    expect(stats.active).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.suspended).toBe(0);
    expect(stats.revenue).toBe(0);
  });
});
