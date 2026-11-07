import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import { closeText } from '../../shared/close-codes.ts';
import type { GameStyle } from '../../shared/game-style.ts';
import type { HomeAction, JoinHome } from '../../shared/home-protocol.ts';
import { PROTOCOL_VERSION } from '../../shared/protocol.ts';
import type { ClientInputPacket, ClientPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import type { BenchAction } from '../../shared/workbench.ts';
import { tapRoomDifficulty } from '../game/analytics/event-tap.ts';
import { parseServerPacket } from './packet-guards.ts';
import { tabToken } from './tab-token.ts';
import type { ConnectOptions, GameTransport } from './transport.ts';

const CONNECT_TIMEOUT_MS = 6000;

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
  /** What the room plays, or null for an empty one. Heard before joining, and answered with `join`; heard again if the room moved on first. */
  onRoom: (style: GameStyle | null) => void = () => {};

  private readonly url: string;
  private joiner: ConnectOptions = { name: '' };
  private socket: WebSocket | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private welcomed = false;
  private finished = false;

  constructor(url: string) {
    this.url = url;
  }

  /** Opens the socket. The room speaks first, so nothing is sent until `onRoom` has been answered. */
  connect(options: ConnectOptions): void {
    this.joiner = options;
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

    socket.onmessage = (event) => this.receive(event.data);
    socket.onclose = (event) => this.finish(this.closeReason(event.code, event.reason));
  }

  /** Asks in, as the style the room said it plays. Campaign brings its gear; Arcade has none to bring. */
  join(style: GameStyle, home?: JoinHome): void {
    const { name, difficulty, character } = this.joiner;
    this.send({ type: 'join', name, token: tabToken(), difficulty, character, style, home, protocol: PROTOCOL_VERSION });
  }

  sendInput(input: ClientInputPacket): void {
    if (this.welcomed) this.send({ type: 'input', input });
  }

  sendBench(action: BenchAction): void {
    if (this.welcomed) this.send({ type: 'bench', action });
  }

  sendHome(action: HomeAction): void {
    if (this.welcomed) this.send({ type: 'home', action });
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
    if (packet.type === 'bye') {
      this.finish(this.closeReason(packet.code, packet.reason));
    } else if (packet.type === 'room') {
      if (!this.welcomed) this.onRoom(packet.style);
    } else if (packet.type === 'welcome') {
      this.welcomed = true;
      this.clearTimeout();
      if (packet.difficulty) tapRoomDifficulty(packet.difficulty);
      this.onWelcome(packet);
    } else if (packet.type === 'snapshot' && this.welcomed) {
      this.onSnapshot(packet);
    }
  }

  private closeReason(code: number, reason = ''): string {
    const told = closeText(code, reason);
    if (told) return told;
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
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
  }
}
