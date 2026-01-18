import type { Redis } from '@upstash/redis';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const TTL_SECONDS = 8 * 24 * 60 * 60; // 8 days TTL for cleanup

function getWeekNumber(): number {
  return Math.floor(Date.now() / MS_PER_WEEK);
}

function getWeekResetTimestamp(): number {
  return (getWeekNumber() + 1) * MS_PER_WEEK;
}

export interface QuotaResult {
  allowed: boolean;
  used: number;
  remaining: number;
  resetAt: number;
}

type QuotaType = 'input' | 'output';

/**
 * Check and record quota usage.
 * For input: checks limit before recording (blocks if exceeded).
 * For output: records first, then checks (allows completion but flags overages).
 */
export async function checkAndRecordQuota(
  redis: Redis,
  email: string,
  chars: number,
  weeklyLimit: number,
  type: QuotaType,
): Promise<QuotaResult> {
  const weekNumber = getWeekNumber().toString();
  const key = `hover:quota:${email}:week:${weekNumber}:${type}`;
  const resetAt = getWeekResetTimestamp();

  const currentUsage = (await redis.get<number>(key)) ?? 0;
  const newUsage = currentUsage + chars;

  if (type === 'input' && newUsage > weeklyLimit) {
    return {
      allowed: false,
      used: currentUsage,
      remaining: Math.max(0, weeklyLimit - currentUsage),
      resetAt,
    };
  }

  await redis.pipeline().incrby(key, chars).expire(key, TTL_SECONDS).exec();

  const allowed = newUsage <= weeklyLimit;
  return {
    allowed,
    used: newUsage,
    remaining: allowed ? weeklyLimit - newUsage : 0,
    resetAt,
  };
}
