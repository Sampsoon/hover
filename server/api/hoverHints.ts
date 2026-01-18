import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { callLLMWithRetry, retrieveHoverHints, type HoverHint } from '@hover/shared';
import {
  verifyGoogleToken,
  checkAndRecordQuota,
  hashEmail,
  initializeStreamResponse,
  writeHint,
  writeError,
  writeComplete,
  HOSTED_API_CONFIG,
  QUOTA_CONFIG,
  MAX_HTML_SIZE,
  type QuotaResult,
} from '../lib/index.js';

const redis = Redis.fromEnv();

interface HoverHintsRequest {
  cleanedHtml?: string;
  googleToken?: string;
}

function setCorsHeaders(response: VercelResponse): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function setQuotaHeaders(response: VercelResponse, input: QuotaResult, output: QuotaResult): void {
  response.setHeader('X-Quota-Input-Remaining', input.remaining);
  response.setHeader('X-Quota-Output-Remaining', output.remaining);
  response.setHeader('X-Quota-Reset', input.resetAt);
}

type ValidationResult =
  | { valid: true; cleanedHtml: string; googleToken: string }
  | { valid: false; error: string; status: number };

function validateRequest(body: HoverHintsRequest): ValidationResult {
  const { cleanedHtml, googleToken } = body;

  if (!cleanedHtml || typeof cleanedHtml !== 'string') {
    return { valid: false, error: 'Missing cleanedHtml field', status: 400 };
  }

  if (cleanedHtml.length > MAX_HTML_SIZE) {
    return { valid: false, error: `HTML too large (max ${MAX_HTML_SIZE.toString()} bytes)`, status: 413 };
  }

  if (!googleToken || typeof googleToken !== 'string') {
    return { valid: false, error: 'Missing authentication', status: 401 };
  }

  return { valid: true, cleanedHtml, googleToken };
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = request.body as HoverHintsRequest;
  const validation = validateRequest(body);
  if (!validation.valid) {
    response.status(validation.status).json({ error: validation.error });
    return;
  }

  const { cleanedHtml, googleToken } = validation;

  const authResult = await verifyGoogleToken(googleToken);
  if (!authResult.valid || !authResult.email) {
    response.status(401).json({ error: authResult.error ?? 'Invalid token' });
    return;
  }

  const userHash = hashEmail(authResult.email);

  const [inputQuota, outputQuota] = await Promise.all([
    checkAndRecordQuota(redis, userHash, cleanedHtml.length, QUOTA_CONFIG.weeklyInputCharLimit, 'input'),
    checkAndRecordQuota(redis, userHash, 0, QUOTA_CONFIG.weeklyOutputCharLimit, 'output'),
  ]);

  setQuotaHeaders(response, inputQuota, outputQuota);

  if (!inputQuota.allowed || !outputQuota.allowed) {
    const errors: string[] = [];
    if (!inputQuota.allowed) {
      errors.push('input');
    }

    if (!outputQuota.allowed) {
      errors.push('output');
    }

    const retryAfter = Math.ceil((inputQuota.resetAt - Date.now()) / 1000);
    response.setHeader('Retry-After', retryAfter);
    response.status(429).json({
      error: `Quota exceeded: ${errors.join(', ')}`,
      retryAfter,
      resetAt: inputQuota.resetAt,
    });
    return;
  }

  initializeStreamResponse(response);

  let totalHints = 0;
  let totalOutputChars = 0;

  try {
    await retrieveHoverHints(cleanedHtml, callLLMWithRetry, HOSTED_API_CONFIG, (hint: HoverHint) => {
      totalOutputChars += JSON.stringify(hint).length;
      totalHints++;
      writeHint(response, hint);
    });

    const finalOutputQuota = await checkAndRecordQuota(
      redis,
      userHash,
      totalOutputChars,
      QUOTA_CONFIG.weeklyOutputCharLimit,
      'output',
    );
    response.setHeader('X-Quota-Output-Remaining', finalOutputQuota.remaining);

    if (!finalOutputQuota.allowed) {
      console.warn(`User ${userHash} exceeded output quota: ${totalOutputChars.toString()} chars`);
    }

    writeComplete(response, totalHints);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    writeError(response, errorMessage);
  }

  response.end();
}
