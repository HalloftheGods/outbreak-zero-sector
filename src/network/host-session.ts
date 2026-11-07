// Hosting an online room from this tab (spec option A). The simulation and the room host run here, the
// host's own player joins over an in-tab loopback, and each guest arrives over its own WebRTC data channel.
// play-api only introduces the peers: game packets never pass through it.
import { DEFAULT_DIFFICULTY } from '../../shared/difficulty.ts';
import type { EmoteId } from '../../shared/emotes.ts';
import type { GameStyle } from '../../shared/game-style.ts';
import { OVERRUN_LIVE, type HomeAction, type JoinHome } from '../../shared/home-protocol.ts';
import type { HostDevice } from '../../shared/lobby/types.ts';
import { parseToHostSignal, type HostSignal, type IceCandidate, type IceServer, type RoomReport } from '../../shared/lobby/lobby-protocol.ts';
import { PROTOCOL_VERSION, type ClientInputPacket, type SnapshotPacket, type WelcomePacket } from '../../shared/protocol.ts';
import { HEARTBEAT_MS, JOIN_DEADLINE_MS, MAX_BUFFERED_BYTES, RESTART_VOTE_MS } from '../../shared/room/limits.ts';
import type { HostClock, PeerSocket } from '../../shared/room/peer.ts';
import { createRoomHost, type HostedPeer, type RoomHost } from '../../shared/room/room-host.ts';
import { GameSimulation } from '../../shared/simulation.ts';
import { CLOSE } from '../../shared/close-codes.ts';
import type { BenchAction } from '../../shared/workbench.ts';
import { loopbackPair } from './packet-pipe.ts';
import { createRoom, PLAY_API, socketUrl } from './play-api.ts';
import { RemoteSession, type RoomSession } from './remote-session.ts';
import { browserRtc, candidateOf, GAME_CHANNEL, rtcConfig, type RtcDeps } from './rtc-pipe.ts';
import type { ConnectOptions } from './transport.ts';

/** The Room DO answers this without waking; it is what keeps the host listed. */
export const KEEPALIVE_MS = 20_000;
/** A dropped signal socket tries again this often, inside the Room's 2 minute grace. */
export const SIGNAL_RETRY_MS = 5_000;
export const SIGNAL_GRACE_MS = 2 * 60_000;
/** How long a guest whose signaling ended may still take to open this end of its channel. */
export const GUEST_SETUP_MS = 15_000;
/** Where the host keeps its key, so a dropped signal socket can come back. Per tab, never in a URL. */
const HOST_KEY_STORE = 'outbreak.hostKey';

const browserClock: HostClock = {
  now: () => performance.now(),
  after: (ms, fn) => setTimeout(fn, ms),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const byteLength = (text: string): number => new TextEncoder().encode(text).length;

function hostDevice(): HostDevice {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return coarse ? 'phone' : 'desktop';
}

interface Guest {
  readonly pc: RTCPeerConnection;
  readonly channel: RTCDataChannel;
  hosted: HostedPeer | null;
  remoteSet: boolean;
  early: IceCandidate[];
  /** Set once the Room says the guest left signaling while this end is still connecting. */
  setupDeadline: ReturnType<typeof setTimeout> | null;
}

/** What the room tells the Lobby, read from the host's own snapshots. */
export function reportOf(snapshot: SnapshotPacket): RoomReport {
  const taken = snapshot.players.reduce((bits, player) => bits | (1 << player.skin), 0);
  const phase = snapshot.phase === 'gameover' ? 'over' : 'playing';
  return { seats: snapshot.players.length, taken, level: snapshot.level, highest: snapshot.level, phase, locked: false };
}

const sameReport = (a: RoomReport | null, b: RoomReport): boolean =>
  a !== null && a.seats === b.seats && a.taken === b.taken && a.level === b.level && a.locked === b.locked && a.phase === b.phase;

export class HostSession implements RoomSession {
  readonly kind = 'coop';
  readonly interpolationDelayMs = 100;

  onWelcome: (packet: WelcomePacket) => void = () => {};
  onSnapshot: (packet: SnapshotPacket) => void = () => {};
  onClosed: (reason: string) => void = () => {};
  onRoom: (style: GameStyle | null) => void = () => {};
  /** The room's code, once play-api has given it one: the host shares it with friends. */
  onHosted: (code: string) => void = () => {};
  /** The signal socket did not come back in time: play goes on, but no new guest can join. */
  onUnlisted: () => void = () => {};

  private options: ConnectOptions = { name: '' };
  private inner: RemoteSession | null = null;
  private room: RoomHost | null = null;
  private code = '';
  private hostKey = '';
  private signal: WebSocket | null = null;
  private keepalive: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private signalLostAt: number | null = null;
  private iceServers: readonly IceServer[] = [];
  private relayOnly = false;
  /** The current signal socket has had its `ready`, so reports and answers can go out. */
  private ready = false;
  private readonly guests = new Map<string, Guest>();
  private lastReport: RoomReport | null = null;
  private finished = false;
  private readonly warnOnLeave = (event: BeforeUnloadEvent): void => {
    // Leaving ends the room for everyone in it.
    event.preventDefault();
    event.returnValue = '';
  };

  constructor(
    private readonly style: GameStyle,
    private readonly api: string = PLAY_API,
    private readonly rtc: RtcDeps = browserRtc,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}

  connect(options: ConnectOptions): void {
    this.options = options;
    void this.start();
  }

  join(style: GameStyle, home?: JoinHome): void {
    this.inner?.join(style, home);
  }

  sendInput(input: ClientInputPacket): void {
    this.inner?.sendInput(input);
  }

  sendBench(action: BenchAction): void {
    this.inner?.sendBench(action);
  }

  sendHome(action: HomeAction): void {
    this.inner?.sendHome(action);
  }

  sendEmote(emote: EmoteId): void {
    this.inner?.sendEmote(emote);
  }

  requestRestart(): void {
    this.inner?.requestRestart();
  }

  /** The guests keep playing, so the host never pauses. */
  setPaused(): void {}

  disconnect(): void {
    if (this.finished) return;
    this.finished = true;
    this.teardown();
  }

  private async start(): Promise<void> {
    const { name, difficulty } = this.options;
    const created = await createRoom(
      {
        protocol: PROTOCOL_VERSION,
        style: this.style,
        difficulty: difficulty ?? DEFAULT_DIFFICULTY,
        visibility: 'private',
        device: hostDevice(),
        ...(name ? { label: name } : {}),
      },
      this.api,
      this.fetcher,
    );
    if (this.finished) return;
    if (!created.ok) return this.finish(created.reason);
    this.code = created.room.code;
    this.hostKey = created.room.hostKey;
    try {
      sessionStorage.setItem(HOST_KEY_STORE, JSON.stringify({ code: this.code, hostKey: this.hostKey }));
    } catch {
      // Storage can be off; the key then lives only in memory.
    }
    this.openRoom();
    this.openSignal();
    globalThis.addEventListener?.('beforeunload', this.warnOnLeave);
    this.onHosted(this.code);
  }

  /** The same room the Node server runs, ticking in this tab, with the host's own player let in first. */
  private openRoom(): void {
    const sim = new GameSimulation({ seed: Math.floor(Math.random() * 0x7fffffff), workbench: 'timed', overrun: OVERRUN_LIVE });
    const room = createRoomHost({
      sim,
      clock: browserClock,
      newId: () => crypto.randomUUID(),
      restartVoteMs: RESTART_VOTE_MS,
      joinDeadlineMs: JOIN_DEADLINE_MS,
      heartbeatMs: HEARTBEAT_MS,
    });
    this.room = room;
    const { pipe, peer } = loopbackPair();
    const inner = new RemoteSession(pipe, { badAddress: 'The game could not start.', noAnswer: 'The game did not start in time.', unreachable: 'The game could not start.' });
    this.inner = inner;
    inner.onRoom = (style) => this.onRoom(style);
    inner.onWelcome = (packet) => this.onWelcome(packet);
    inner.onSnapshot = (packet) => {
      this.report(reportOf(packet));
      this.onSnapshot(packet);
    };
    inner.onClosed = (reason) => this.finish(reason);
    inner.connect(this.options);
    const hosted = room.admit(peer, 'host');
    peer.onFrame = (text) => hosted?.receive(text, byteLength(text));
    peer.onClosed = () => hosted?.closed();
    peer.onProbe = () => hosted?.heard();
  }

  // ---- Signaling ----

  private openSignal(): void {
    const signal = this.rtc.socket(socketUrl(this.api, `/v1/rooms/${this.code}/host`));
    this.signal = signal;
    this.ready = false;
    signal.onopen = () => signal.send(JSON.stringify({ type: 'auth', hostKey: this.hostKey } satisfies HostSignal));
    signal.onmessage = (event) => void this.fromRoom(event.data);
    signal.onclose = (event) => this.signalClosed(event.code);
    if (this.keepalive === null) {
      this.keepalive = setInterval(() => {
        if (this.signal?.readyState === WebSocket.OPEN) this.signal.send('ping');
      }, KEEPALIVE_MS);
    }
  }

  /** Guests already in play are unaffected: their packets go peer to peer. Only new joins wait for the socket to return. */
  private signalClosed(code: number): void {
    this.signal = null;
    this.ready = false;
    if (this.finished) return;
    const refused = code === 1008 || code === CLOSE.notFound;
    if (refused) return this.finish('The online room closed. Your game can no longer take new survivors.');
    const now = Date.now();
    this.signalLostAt ??= now;
    if (now - this.signalLostAt >= SIGNAL_GRACE_MS) return this.onUnlisted();
    this.retry = setTimeout(() => {
      this.retry = null;
      if (!this.finished) this.openSignal();
    }, SIGNAL_RETRY_MS);
  }

  private async fromRoom(raw: unknown): Promise<void> {
    const signal = parseToHostSignal(raw);
    if (!signal || this.finished) return;
    if (signal.type === 'ready') {
      this.ready = true;
      this.iceServers = signal.iceServers;
      this.relayOnly = signal.relayOnly;
      this.signalLostAt = null;
      // A fresh socket owes the Lobby the room's state.
      const last = this.lastReport;
      this.lastReport = null;
      if (last) this.report(last);
    } else if (signal.type === 'offer') {
      await this.acceptGuest(signal.peerId, signal.sdp);
    } else if (signal.type === 'ice') {
      await this.addIce(signal.peerId, signal.ice);
    } else {
      // A guest closes its signal socket as soon as its own end of the channel opens, which can be a moment
      // before this end does. So a half-open guest gets a little longer before it is given up on.
      const guest = this.guests.get(signal.peerId);
      if (guest && guest.channel.readyState !== 'open' && guest.setupDeadline === null) {
        guest.setupDeadline = setTimeout(() => {
          if (this.guests.get(signal.peerId) === guest && guest.channel.readyState !== 'open') this.dropGuest(signal.peerId);
        }, GUEST_SETUP_MS);
      }
    }
  }

  private tell(message: HostSignal): void {
    if (this.signal?.readyState === WebSocket.OPEN) this.signal.send(JSON.stringify(message));
  }

  private report(report: RoomReport): void {
    if (!this.ready) {
      this.lastReport = report;
      return;
    }
    if (sameReport(this.lastReport, report)) return;
    this.lastReport = report;
    this.tell({ type: 'report', report });
  }

  // ---- Guests ----

  private async acceptGuest(peerId: string, sdp: string): Promise<void> {
    if (this.guests.has(peerId) || !this.room) return;
    const pc = this.rtc.peer(rtcConfig(this.iceServers, this.relayOnly));
    const channel = pc.createDataChannel('game', GAME_CHANNEL);
    const guest: Guest = { pc, channel, hosted: null, remoteSet: false, early: [], setupDeadline: null };
    this.guests.set(peerId, guest);
    pc.onicecandidate = (event) => {
      const ice = candidateOf(event);
      if (ice) this.tell({ type: 'ice', peerId, ice });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.dropGuest(peerId);
    };
    channel.onopen = () => {
      if (guest.setupDeadline !== null) clearTimeout(guest.setupDeadline);
      guest.setupDeadline = null;
      guest.hosted = this.room?.admit(this.peerOf(guest), peerId) ?? null;
    };
    channel.onmessage = (event) => {
      if (typeof event.data === 'string') guest.hosted?.receive(event.data, byteLength(event.data));
      else guest.hosted?.receive(null, (event.data as ArrayBuffer).byteLength ?? 0);
    };
    channel.onclose = () => this.dropGuest(peerId);
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp });
      guest.remoteSet = true;
      for (const ice of guest.early) await pc.addIceCandidate(ice);
      guest.early = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.tell({ type: 'answer', peerId, sdp: answer.sdp ?? '' });
    } catch {
      this.dropGuest(peerId);
    }
  }

  private async addIce(peerId: string, ice: IceCandidate): Promise<void> {
    const guest = this.guests.get(peerId);
    if (!guest) return;
    if (!guest.remoteSet) {
      guest.early.push(ice);
      return;
    }
    try {
      await guest.pc.addIceCandidate(ice);
    } catch {
      // A late or duplicate candidate; the connection carries on without it.
    }
  }

  /** A data channel as the room host's link. It has no close code, so close() sends a bye first. */
  private peerOf(guest: Guest): PeerSocket {
    const { pc, channel } = guest;
    return {
      get open() {
        return channel.readyState === 'open';
      },
      send: (text) => {
        if (channel.readyState === 'open') channel.send(text);
      },
      close: (code, reason) => {
        if (channel.readyState === 'open') channel.send(JSON.stringify({ type: 'bye', code, reason }));
        channel.close();
      },
      drop: () => pc.close(),
      canTakeFrame: (bytes) => channel.bufferedAmount + bytes <= MAX_BUFFERED_BYTES,
      // SCTP checks the link itself; a connected channel counts as an answer.
      probe: () => {
        if (pc.connectionState === 'connected') guest.hosted?.heard();
      },
    };
  }

  private dropGuest(peerId: string): void {
    const guest = this.guests.get(peerId);
    if (!guest) return;
    this.guests.delete(peerId);
    if (guest.setupDeadline !== null) clearTimeout(guest.setupDeadline);
    guest.channel.onclose = null;
    guest.pc.onconnectionstatechange = null;
    guest.hosted?.closed();
    guest.channel.close();
    guest.pc.close();
  }

  // ---- Ending ----

  private finish(reason: string): void {
    if (this.finished) return;
    this.finished = true;
    this.teardown();
    this.onClosed(reason);
  }

  /** The room ends: guests hear 4011 over their channels, the Room DO hears `end` and tombstones the code. */
  private teardown(): void {
    globalThis.removeEventListener?.('beforeunload', this.warnOnLeave);
    if (this.keepalive !== null) clearInterval(this.keepalive);
    if (this.retry !== null) clearTimeout(this.retry);
    this.keepalive = null;
    this.retry = null;
    for (const [peerId, guest] of [...this.guests]) {
      if (guest.channel.readyState === 'open') guest.channel.send(JSON.stringify({ type: 'bye', code: CLOSE.hostLeft, reason: 'host left' }));
      this.dropGuest(peerId);
    }
    this.room?.shutdown();
    this.room = null;
    const inner = this.inner;
    this.inner = null;
    inner?.disconnect();
    const signal = this.signal;
    this.signal = null;
    if (signal) {
      signal.onclose = null;
      signal.onmessage = null;
      if (signal.readyState === WebSocket.OPEN) signal.send(JSON.stringify({ type: 'end' } satisfies HostSignal));
      signal.close(1000, 'host left');
    }
    try {
      sessionStorage.removeItem(HOST_KEY_STORE);
    } catch {
      // Nothing was stored.
    }
  }
}
