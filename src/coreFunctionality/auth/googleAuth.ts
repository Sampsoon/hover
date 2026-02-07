import { storage, type GoogleAuthConfig } from '../../storage';

async function fetchUserEmail(token: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user email');
  }

  const data = (await response.json()) as { email: string };
  return data.email;
}

export async function loginWithGoogle(): Promise<void> {
  const hasPermission = await chrome.permissions.contains({ permissions: ['identity'] });

  if (!hasPermission) {
    const granted = await chrome.permissions.request({ permissions: ['identity'] });
    if (!granted) {
      throw new Error('Permission denied');
    }
  }

  const result = await chrome.identity.getAuthToken({ interactive: true });
  const token = result.token;

  if (!token) {
    throw new Error('Please sign into Chrome to continue');
  }

  const email = await fetchUserEmail(token);

  await storage.googleAuth.set({
    googleToken: token,
    userEmail: email,
    expiresAt: Date.now() + 3600 * 1000,
  });
}

export async function logout(): Promise<void> {
  const auth = await storage.googleAuth.get();

  if (auth?.googleToken) {
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${auth.googleToken}`).catch(() => undefined);
    await chrome.identity.removeCachedAuthToken({ token: auth.googleToken }).catch(() => undefined);
  }

  await storage.googleAuth.remove();
}

async function silentlyRefreshToken(): Promise<GoogleAuthConfig | undefined> {
  try {
    const hasPermission = await chrome.permissions.contains({ permissions: ['identity'] });
    if (!hasPermission) {
      console.error('Permission denied for silently refreshing token');
      return undefined;
    }

    const result = await chrome.identity.getAuthToken({ interactive: false });
    const token = result.token;

    if (!token) {
      return undefined;
    }

    const email = await fetchUserEmail(token);

    const newAuth: GoogleAuthConfig = {
      googleToken: token,
      userEmail: email,
      expiresAt: Date.now() + 3600 * 1000,
    };

    await storage.googleAuth.set(newAuth);
    return newAuth;
  } catch {
    return undefined;
  }
}

export async function getAuthState(): Promise<GoogleAuthConfig | undefined> {
  const auth = await storage.googleAuth.get();

  if (!auth?.googleToken) {
    return undefined;
  }

  if (auth.expiresAt && auth.expiresAt < Date.now()) {
    const refreshed = await silentlyRefreshToken();

    if (!refreshed) {
      await storage.googleAuth.remove();
    }

    return refreshed;
  }

  return auth;
}
