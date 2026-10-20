// Turns an API failure into a sentence a person can act on. The backend's own
// wording is fine for validation ("The email has already been taken."), but
// codes, HTTP jargon, route names, SQL and stack traces never reach the screen.

type ErrorLike = {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: any;
};

export const GENERIC_ERROR = 'Something went wrong. Please try again.';

const INTERNALS = /SQLSTATE|Illuminate|vendor\/|Exception|stack trace|Undefined|Call to|Class "|syntax error|HTTP_\d{3}/i;

// Laravel's "(and 2 more errors)" tail is noise.
const clean = (s: string) => s.replace(/\s*\(and \d+ more errors?\)\.?$/i, '').trim();

export function friendlyMessage(error: ErrorLike | null | undefined, fallback: string = GENERIC_ERROR): string {
  if (!error) return fallback;
  const status = error.statusCode;
  const raw = typeof error.message === 'string' ? error.message : '';

  // No response at all: the phone is offline, the request timed out, or it was never sent.
  if (status === undefined) {
    if (/abort|timed? ?out/i.test(raw)) return 'That took too long. Check your connection and try again.';
    if (/network request failed|failed to fetch|load failed|network error|offline/i.test(raw) || error.code === 'NETWORK_ERROR') {
      return "Can't reach Wami. Check your internet connection and try again.";
    }
    if (!raw || INTERNALS.test(raw)) return fallback;
    return raw;
  }

  // Validation: the first field message is the most useful one.
  const fieldErrors = error.details && typeof error.details === 'object' ? error.details : null;
  const firstField =
    fieldErrors && !Array.isArray(fieldErrors)
      ? Object.values(fieldErrors).flat().find((v) => typeof v === 'string')
      : undefined;

  // Known messages worth rewording.
  if (/failed to send verification email/i.test(raw)) {
    return "We couldn't send your code just now. Please try again in a moment.";
  }

  switch (true) {
    case status === 401:
      return raw && !/unauthenticated/i.test(raw) && !INTERNALS.test(raw) ? clean(raw) : 'Please sign in again.';
    case status === 403:
      return /creative/i.test(raw)
        ? 'This is only available for creative accounts.'
        : "You don't have access to do that.";
    case status === 404:
      return "We couldn't find that. It may have been removed.";
    case status === 405:
      return "That isn't available right now.";
    case status === 408 || status === 504:
      return 'That took too long. Check your connection and try again.';
    case status === 409:
      return raw && !INTERNALS.test(raw) ? clean(raw) : 'That already exists.';
    case status === 400 || status === 422:
      if (typeof firstField === 'string') return clean(firstField);
      return raw && !INTERNALS.test(raw) ? clean(raw) : 'Please check what you entered and try again.';
    case status === 429:
      return "You're doing that too fast. Wait a moment and try again.";
    case status >= 500:
      return 'Something went wrong on our side. Please try again in a moment.';
    default:
      return raw && !INTERNALS.test(raw) ? clean(raw) : fallback;
  }
}

/** True when the backend says this account type can't use the feature. */
export function isCreativeOnly(error: ErrorLike | null | undefined): boolean {
  return error?.statusCode === 403 && /creative/i.test(error?.message ?? '');
}
