// Where to send someone after they sign in: back to what they were doing when
// a guest tapped something that needs an account (save, book, message, buy).

let returnTo: string | null = null;

export function setReturnTo(path: string | null) {
  returnTo = path;
}

/** Returns the saved path once, then forgets it. */
export function consumeReturnTo(): string | null {
  const path = returnTo;
  returnTo = null;
  return path;
}
