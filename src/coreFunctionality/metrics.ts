import { storage, TRACKING_API_URL } from '../storage';
import { APIProvider } from '@hover/shared';

async function getOrCreateVisitorId(): Promise<string> {
  const existingId = await storage.visitorId.get();

  if (existingId) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  await storage.visitorId.set(newId);
  return newId;
}

export async function trackProviderRequest(provider: APIProvider | undefined, requestSize: number): Promise<void> {
  const visitorId = await getOrCreateVisitorId();

  fetch(TRACKING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, provider: provider ?? 'InvalidProvider', requestSize }),
  }).catch(() => {
    // Silently ignore failures - analytics should never break the app
  });
}
