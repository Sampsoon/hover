/**
 * Analytics Tracking API
 *
 * Receives tracking events from the Chrome extension.
 * Stores aggregate metrics in Vercel KV (Redis).
 * Rate limiting is handled by Vercel Firewall (configured in dashboard).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { isAPIProvider } from '@hover/shared';

enum RedisKey {
  TotalRequests = 'total_requests',
  UniqueUsersHyperloglog = 'unique_users_hyperloglog',
  UniqueUsersEstimation = 'unique_users_estimation',
}

const redis =
  process.env.HOVER_KV_REST_API_URL && process.env.HOVER_KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.HOVER_KV_REST_API_URL,
        token: process.env.HOVER_KV_REST_API_TOKEN,
      })
    : undefined;

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (!redis) {
    response.status(500).json({ error: 'Redis not configured' });
    console.error('Redis not configured');
    return;
  }

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = request.body as {
    visitorId?: string;
    provider?: string;
    requestSize?: number;
  };
  const { visitorId, provider, requestSize } = body;

  if (!visitorId || typeof visitorId !== 'string' || !isValidUUID(visitorId)) {
    response.status(400).json({ error: 'Invalid visitorId' });
    return;
  }

  if (!provider || typeof provider !== 'string' || !isAPIProvider(provider)) {
    response.status(400).json({ error: 'Invalid provider' });
    return;
  }

  if (requestSize === undefined || typeof requestSize !== 'number' || requestSize < 0) {
    response.status(400).json({ error: 'Invalid requestSize' });
    return;
  }

  try {
    const hour = new Date().toISOString().slice(0, 13);
    await redis
      .pipeline()
      .incr(RedisKey.TotalRequests)
      .pfadd(RedisKey.UniqueUsersHyperloglog, visitorId)
      .incr(`hourly:${hour}`)
      .incr(`provider:${provider}`)
      .exec();

    const count = await redis.pfcount(RedisKey.UniqueUsersHyperloglog);
    await redis.set(RedisKey.UniqueUsersEstimation, count);
  } catch (error) {
    console.error('KV error:', error);
  }

  response.status(200).json({ success: true });
}
