import { useEffect, useState } from 'react';
import { Button } from '../common';
import { GoogleIcon } from '../common/Icons';
import { loginWithGoogle, logout, getAuthState } from '../../../coreFunctionality/auth/googleAuth';
import type { GoogleAuthConfig } from '../../../storage/types';

interface GoogleAuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function GoogleAuthButton({ onAuthChange }: GoogleAuthButtonProps) {
  const [authState, setAuthState] = useState<GoogleAuthConfig | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuthState(): Promise<void> {
      const state = await getAuthState();
      setAuthState(state);
      onAuthChange?.(!!state?.googleToken);
    }

    void loadAuthState();
  }, [onAuthChange]);

  async function handleLogin(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      const state = await getAuthState();
      setAuthState(state);
      onAuthChange?.(!!state?.googleToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await logout();
      setAuthState(undefined);
      onAuthChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }

  const isAuthenticated = !!authState?.googleToken;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {isAuthenticated ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-body-size)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-color)',
              }}
            />
            <span>Signed in as {authState.userEmail}</span>
          </div>
          <Button onClick={() => void handleLogout()} style={{ padding: '6px 10px', fontSize: '13px' }}>
            {isLoading ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => void handleLogin()}
          icon={<GoogleIcon />}
          style={{
            justifyContent: 'center',
            padding: '10px 16px',
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      )}

      {error && (
        <div
          style={{
            color: 'var(--alert-color)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
