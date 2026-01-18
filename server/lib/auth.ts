interface GoogleTokenInfo {
  email: string;
  email_verified: string;
  expires_in: string;
  access_type?: string;
}

export interface VerifyResult {
  valid: boolean;
  email?: string;
  error?: string;
}
export async function verifyGoogleToken(token: string): Promise<VerifyResult> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      return { valid: false, error: 'Invalid token' };
    }

    const info = (await response.json()) as GoogleTokenInfo;

    if (info.email_verified !== 'true') {
      return { valid: false, error: 'Email not verified' };
    }

    const expiresIn = parseInt(info.expires_in, 10);
    if (isNaN(expiresIn) || expiresIn <= 0) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, email: info.email };
  } catch {
    return { valid: false, error: 'Token verification failed' };
  }
}
