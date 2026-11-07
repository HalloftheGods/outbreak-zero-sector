import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import { RemoteSession } from './remote-session.ts';
import { SocketPipe } from './socket-pipe.ts';

interface PageLocation {
  readonly hostname: string;
  readonly protocol: string;
}

/**
 * Accepts what people actually type: blank, a host, host:port, or a full URL.
 * Returns null when the text cannot be a server address.
 */
export function resolveServerUrl(address: string, page: PageLocation): string | null {
  const scheme = page.protocol === 'https:' ? 'wss:' : 'ws:';
  const text = address.trim();
  if (!text) return `${scheme}//${page.hostname}:${DEFAULT_SERVER_PORT}`;
  const hasScheme = /^[a-z]+:\/\//i.test(text);
  try {
    const url = new URL(hasScheme ? text : `${scheme}//${text}`);
    if (url.protocol === 'http:') url.protocol = 'ws:';
    if (url.protocol === 'https:') url.protocol = 'wss:';
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return null;
    if (!url.hostname) return null;
    if (!url.port && !hasScheme) url.port = String(DEFAULT_SERVER_PORT);
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

/** Co-op play against the ws server. */
export function createSocketSession(url: string): RemoteSession {
  return new RemoteSession(new SocketPipe(url));
}
