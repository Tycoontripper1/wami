import { Alert } from '@/components/AppAlert';
import type { RootState } from '@/store/store';
import { setReturnTo } from '@/utils/authReturn';
import { usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * Browsing is open to everyone; doing something is not. Wrap an action in
 * `gate("why", fn)`: signed-in people run it straight away, guests get a short
 * prompt and, after signing in, come back to the screen they were on.
 */
export function useAuthGate() {
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  const gate = useCallback(
    (reason: string, action: () => void): boolean => {
      if (signedIn) {
        action();
        return true;
      }
      const remember = () => setReturnTo(pathname && pathname !== '/' ? pathname : null);
      Alert.alert(
        'Sign in to continue',
        reason,
        [
          {
            text: 'Sign in',
            onPress: () => {
              remember();
              router.push('/(auth)/sign-in' as any);
            },
          },
          {
            text: 'Create an account',
            onPress: () => {
              remember();
              router.push('/(auth)/sign-up-email' as any);
            },
          },
          { text: 'Not now', style: 'cancel' },
        ],
        { kind: 'info' }
      );
      return false;
    },
    [signedIn, router, pathname]
  );

  return { signedIn, gate };
}
