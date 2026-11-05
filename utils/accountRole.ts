export type AccountRole = 'creative' | 'buyer' | 'both';

/**
 * Which side of Wami an account is on. The API says `promote` for someone who
 * sells or offers a service, `discover` for someone who only hires and buys,
 * and `both` for either; other spellings are read the same way.
 */
export function roleOf(accountType?: string | null): AccountRole | null {
  switch (String(accountType ?? '').toLowerCase()) {
    case 'promote':
    case 'creative':
    case 'creator':
    case 'seller':
      return 'creative';
    case 'discover':
    case 'buyer':
    case 'client':
    case 'customer':
      return 'buyer';
    case 'both':
      return 'both';
    default:
      return null;
  }
}
