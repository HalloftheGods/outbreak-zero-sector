import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import type { PacketPipe, PipeHandlers } from './packet-pipe.ts';
import { RemoteSession } from './remote-session.ts';

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

/** A WebSocket as a pipe. */
export class WsPipe implements PacketPipe {
  private socket: WebSocket | null = null;

  constructor(private readonly url: string) {}

  open(handlers: PipeHandlers): void {
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.onmessage = (event) => handlers.message(event.data);
    socket.onclose = (event) => handlers.closed(event.code, event.reason);
  }

  send(text: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(text);
  }

  close(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
  }
}

/** Co-op play against the ws server. */
export class SocketSession extends RemoteSession {
  constructor(url: string) {
    super(new WsPipe(url), {
      badAddress: `Bad server address: ${url}`,
      noAnswer: `No answer from ${url}. Is the server running?`,
      unreachable: `Could not reach ${url}. Is the server running?`,
    });
  }
}
