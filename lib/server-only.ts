export const isServer = typeof window === 'undefined';

export function ensureServerOnly() {
  if (!isServer) {
    throw new Error('This module can only be used on the server');
  }
}
