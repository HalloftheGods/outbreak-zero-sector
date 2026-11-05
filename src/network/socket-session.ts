import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import type { ClientInputPacket, ClientPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import { parseServerPacket } from './packet-guards.ts';
import { tabToken } from './tab-token.ts';
import type { GameTransport } from './transport.ts';

const CONNECT_TIMEOUT_MS = 6000;
const ROOM_FULL_CLOSE_CODE = 4000;
const SERVER_BUSY_CLOSE_CODE = 4001;

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
export class SocketSession implements GameTransport {
  readonly kind = 'coop';
  readonly interpolationDelayMs = 100;

  onWelcome: (packet: WelcomePacket) => void = () => {};
  onSnapshot: (packet: SnapshotPacket) => void = () => {};
  onClosed: (reason: string) => void = () => {};

  private readonly url: string;
  private socket: WebSocket | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private welcomed = false;
  private finished = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(name: string): void {
    let socket: WebSocket;
    try {
      socket = new WebSocket(this.url);
    } catch {
      this.finish(`Bad server address: ${this.url}`);
      return;
    }
    this.socket = socket;
    this.timeout = setTimeout(() => {
      this.finish(`No answer from ${this.url}. Is the server running?`);
    }, CONNECT_TIMEOUT_MS);

    socket.onopen = () => this.send({ type: 'join', name, token: tabToken() });
    socket.onmessage = (event) => this.receive(event.data);
    socket.onclose = (event) => this.finish(this.closeReason(event.code));
  }

  sendInput(input: ClientInputPacket): void {
    if (this.welcomed) this.send({ type: 'input', input });
  }

  requestRestart(): void {
    this.send({ type: 'restart' });
  }

  /** Other survivors keep playing, so nothing here can stop the clock. */
  setPaused(): void {}

  disconnect(): void {
    this.finished = true;
    this.teardown();
  }

  private send(packet: ClientPacket): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(packet));
  }

  private receive(raw: unknown): void {
    const packet = parseServerPacket(raw);
    if (!packet || this.finished) return;
    if (packet.type === 'welcome') {
      this.welcomed = true;
      this.clearTimeout();
      this.onWelcome(packet);
    } else if (packet.type === 'snapshot' && this.welcomed) {
      this.onSnapshot(packet);
    }
  }

  private closeReason(code: number): string {
    if (code === ROOM_FULL_CLOSE_CODE) return 'That room is full.';
    if (code === SERVER_BUSY_CLOSE_CODE) return 'That server is busy. Try again in a moment.';
    if (this.welcomed) return 'The connection to the server dropped.';
    return `Could not reach ${this.url}. Is the server running?`;
  }

  private finish(reason: string): void {
    if (this.finished) return;
    this.finished = true;
    this.teardown();
    this.onClosed(reason);
  }

  private clearTimeout(): void {
    if (this.timeout !== null) clearTimeout(this.timeout);
    this.timeout = null;
  }

  private teardown(): void {
    this.clearTimeout();
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
  }
}
