import { closeText } from '../../shared/close-codes.ts';
import type { EmoteId } from '../../shared/emotes.ts';
import type { GameStyle } from '../../shared/game-style.ts';
import type { HomeAction, JoinHome } from '../../shared/home-protocol.ts';
import { PROTOCOL_VERSION } from '../../shared/protocol.ts';
import type { ClientInputPacket, ClientPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import type { BenchAction } from '../../shared/workbench.ts';
import { tapRoomDifficulty } from '../game/analytics/event-tap.ts';
import type { PacketPipe } from './packet-pipe.ts';
import { parseServerPacket } from './packet-guards.ts';
import { tabToken } from './tab-token.ts';
import type { ConnectOptions, GameTransport } from './transport.ts';

const CONNECT_TIMEOUT_MS = 6000;

/** Co-op play against a room, over whichever link the pipe is. */
export class RemoteSession implements GameTransport {
  readonly kind = 'coop';
  readonly interpolationDelayMs = 100;

  onWelcome: (packet: WelcomePacket) => void = () => {};
  onSnapshot: (packet: SnapshotPacket) => void = () => {};
  onClosed: (reason: string) => void = () => {};
  /** What the room plays, or null for an empty one. Heard before joining, and answered with `join`; heard again if the room moved on first. */
  onRoom: (style: GameStyle | null) => void = () => {};

  private readonly pipe: PacketPipe;
  private joiner: ConnectOptions = { name: '' };
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private welcomed = false;
  private finished = false;

  constructor(pipe: PacketPipe) {
    this.pipe = pipe;
  }

  /** Brings the link up. The room speaks first, so nothing is sent until `onRoom` has been answered. */
  connect(options: ConnectOptions): void {
    this.joiner = options;
    this.pipe.onText = (text) => this.receive(text);
    this.pipe.onClose = (code, reason) => this.finish(this.closeReason(code, reason));
    try {
      this.pipe.open?.();
    } catch {
      this.finish(`Bad server address: ${this.pipe.label}`);
      return;
    }
    this.timeout = setTimeout(() => {
      this.finish(`No answer from ${this.pipe.label}. Is the server running?`);
    }, CONNECT_TIMEOUT_MS);
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

  sendEmote(emote: EmoteId): void {
    if (this.welcomed) this.send({ type: 'emote', emote });
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
    this.pipe.send(JSON.stringify(packet));
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
    return `Could not reach ${this.pipe.label}. Is the server running?`;
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
    this.pipe.close();
  }
}
