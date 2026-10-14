import {
  disconnectInstagram,
  getInstagramConnectUrl,
  getInstagramStatus,
  importInstagramPosts,
} from '@/services/api/instagramApiService';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type InstagramPhase =
  | 'checking' // asking the backend whether an account is already connected
  | 'idle' // not connected
  | 'connecting' // browser open / waiting for the backend to confirm
  | 'connected'
  | 'importing'
  | 'imported'
  | 'error';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The OAuth URL carries a one-off `state`, so it is not kept for long.
const URL_MAX_AGE_MS = 4 * 60 * 1000;

/** Turns an API failure into something a person can act on. */
function messageFrom(error: any, fallback: string): string {
  const msg = typeof error?.message === 'string' ? error.message : '';
  // Never show raw server internals (SQL, stack traces) to users.
  if (!msg || /SQLSTATE|Illuminate|vendor\/|Exception/i.test(msg)) return fallback;
  // The browser refused to open the Instagram window (web only).
  if (/popup/i.test(msg)) {
    return 'Your browser blocked the Instagram window. Allow pop-ups for this site, then try again.';
  }
  return msg;
}

/**
 * Drives the real Instagram connect -> import flow:
 *   1. GET /instagram/connect for the OAuth URL and open it in the in-app browser
 *   2. when the browser closes, poll GET /instagram/status until it says connected
 *   3. POST /instagram/import
 * The app never sees the OAuth code; Instagram sends it to the backend's callback.
 */
export function useInstagramConnection() {
  const [phase, setPhase] = useState<InstagramPhase>('checking');
  const [username, setUsername] = useState<string | undefined>();
  const [importedCount, setImportedCount] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  // Fetched ahead of the tap: on the web, a pop-up is only allowed if it opens
  // synchronously from the user's click, so the URL must already be in hand.
  const prefetched = useRef<{ url: string; at: number } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safe = useCallback(<T,>(fn: () => T) => {
    if (mounted.current) fn();
  }, []);

  const prefetchUrl = useCallback(async () => {
    try {
      const url = await getInstagramConnectUrl();
      prefetched.current = { url, at: Date.now() };
    } catch {
      prefetched.current = null; // fetched on demand in connect() instead
    }
  }, []);

  /** Ask the backend where things stand (also used on first render). */
  const refresh = useCallback(async () => {
    try {
      const status = await getInstagramStatus();
      safe(() => {
        setUsername(status.username);
        setPhase(status.connected ? 'connected' : 'idle');
      });
      if (!status.connected) void prefetchUrl();
      return status.connected;
    } catch (e: any) {
      safe(() => {
        setPhase('idle');
        setError(null);
      });
      return false;
    }
  }, [safe, prefetchUrl]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Coming back from the browser: pick up a connection that finished after
  // the first check gave up (slow callback, or completed by hand).
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && (phaseRef.current === 'error' || phaseRef.current === 'idle')) {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const connect = useCallback(async () => {
    setError(null);
    setPhase('connecting');
    try {
      const cached = prefetched.current;
      prefetched.current = null; // the state is single-use
      const url =
        cached && Date.now() - cached.at < URL_MAX_AGE_MS ? cached.url : await getInstagramConnectUrl();

      // Instagram redirects to the backend's callback page, not to the app,
      // so the browser is simply closed by the user afterwards.
      const result = await WebBrowser.openAuthSessionAsync(url, 'wami://instagram');
      if (!mounted.current) return false;

      if (result.type === 'cancel' || result.type === 'dismiss') {
        // They may have finished and closed the page; the status call decides.
      }

      // The callback is processed server-side; give it a moment to land.
      for (let attempt = 0; attempt < 6; attempt++) {
        const status = await getInstagramStatus();
        if (!mounted.current) return false;
        if (status.connected) {
          setUsername(status.username);
          setPhase('connected');
          return true;
        }
        await sleep(1200);
      }

      setPhase('error');
      setError("We couldn't confirm the connection. If Instagram showed an error, please try again.");
      void prefetchUrl();
      return false;
    } catch (e: any) {
      safe(() => {
        setPhase('error');
        setError(messageFrom(e, "We couldn't reach Instagram right now. Please try again."));
      });
      void prefetchUrl();
      return false;
    }
  }, [safe, prefetchUrl]);

  const importPosts = useCallback(async () => {
    setError(null);
    setPhase('importing');
    try {
      const result = await importInstagramPosts();
      safe(() => {
        setImportedCount(result.count);
        setPhase('imported');
      });
      return true;
    } catch (e: any) {
      safe(() => {
        setPhase('error');
        setError(messageFrom(e, "We couldn't import your posts. Please try again."));
      });
      return false;
    }
  }, [safe]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      await disconnectInstagram();
      safe(() => {
        setUsername(undefined);
        setImportedCount(undefined);
        setPhase('idle');
      });
    } catch (e: any) {
      safe(() => {
        setPhase('error');
        setError(messageFrom(e, "We couldn't disconnect Instagram. Please try again."));
      });
    }
  }, [safe]);

  return { phase, username, importedCount, error, connect, importPosts, disconnect, refresh };
}
