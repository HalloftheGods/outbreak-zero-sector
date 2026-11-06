/** Where gameplay analytics go. Nothing here loads or sends anything: see sender.ts, which waits for consent. */

/** The Google Analytics 4 measurement id. */
export const MEASUREMENT_ID = 'G-6D3R9CK91X';

export const GOOGLE_TAG_URL = 'https://www.googletagmanager.com/gtag/js';

/** Where the player's choice is kept, apart from the other saves so old saves load untouched. */
export const CONSENT_KEY = 'outbreak.analytics-consent';

/** A run that fails over and over must not turn into a flood of error events. */
export const MAX_ERROR_EVENTS = 3;

/** A gap longer than this between frames is a hidden tab or a stall, not a frame rate. */
export const FRAME_GAP_LIMIT_MS = 1000;

const LOCAL_HOSTS: readonly string[] = ['localhost', '127.0.0.1', '[::1]', '::1'];

/** The machine the developer is sitting at: never counted. */
export function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const isNamedLocal = LOCAL_HOSTS.includes(host);
  const isLocalSubdomain = host.endsWith('.localhost');
  return isNamedLocal || isLocalSubdomain;
}
