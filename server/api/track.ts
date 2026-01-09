/**
 * Analytics Tracking API
 *
 * Receives tracking events from the Chrome extension and forwards to Vercel Analytics.
 * Rate limiting is handled by Vercel Firewall (configured in dashboard).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { track } from '@vercel/analytics/server';
import { isAPIProvider } from '@hover/shared';

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
    await track('hover_hint_request', { visitorId, provider, requestSize }, { request });
    response.status(200).json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    response.status(500).json({ error: 'Tracking failed' });
  }
}
