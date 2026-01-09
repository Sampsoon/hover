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

const redis = Redis.fromEnv();

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
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
    const hour = new Date().toISOString().slice(0, 13); // "2025-01-09T14"
    await redis.pipeline().incr('total_requests').pfadd('unique_users', visitorId).incr(`hourly:${hour}`).exec();
  } catch (error) {
    console.error('KV error:', error);
  }

  response.status(200).json({ success: true });
}
