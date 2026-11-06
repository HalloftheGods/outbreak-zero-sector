import { randomInt, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { DEFAULT_SERVER_PORT, MAX_PLAYERS, TICK_RATE } from '../shared/constants.ts';
import type { DifficultyId } from '../shared/difficulty.ts';
import type { ClientPacket, ServerPacket, SnapshotPacket } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { viewFor } from '../shared/snapshot-view.ts';
import { parseClientPacket } from './packets.ts';

const TICK_MS = 1000 / TICK_RATE;
/** After a stall, drop the backlog rather than fast-forward the world. */
const MAX_LAG_MS = 250;
const MAX_CATCH_UP_TICKS = 3;
const HEARTBEAT_MS = 10000;
const MAX_PACKET_BYTES = 2048;
/** A few snapshots: past this a client skips frames rather than falling further behind, and its pings still get through. */
const MAX_BUFFERED_BYTES = 1 << 15;
const ROOM_FULL_CODE = 4000;
const SERVER_BUSY_CODE = 4001;
const JOIN_TIMEOUT_CODE = 4002;
/** A socket that has not joined by then is closed. */
const JOIN_DEADLINE_MS = 10000;
/** Sockets allowed to sit unjoined at once; a real player is only here for a moment. */
const MAX_UNJOINED_SOCKETS = 16;
/** The share of those one address can hold, so a single machine cannot lock everyone else out. */
const MAX_UNJOINED_PER_ADDRESS = 4;
/** How long the first Play Again waits for the rest, so a hidden tab cannot hold the room for ever. */
const RESTART_VOTE_MS = 15000;
/** Packets a client may send each second. The game sends 30, so only a flood ever runs dry. */
const PACKETS_PER_SEC = 120;
/** What a client can send at once after a quiet spell, which covers a stall on its side. */
const PACKET_BURST = 240;

interface Client {
  readonly socket: WebSocket;
  readonly address: string;
  /** Set once the client has joined. */
  playerId: string | null;
  alive: boolean;
  /** Asked to play again since the run ended. */
  wantsRestart: boolean;
  /** Packets it may still send, refilled with time. */
  packetAllowance: number;
  allowanceAt: number;
  joinDeadline: NodeJS.Timeout;
}

export interface GameServerOptions {
  readonly port: number;
  readonly seed?: number;
  /** Lets a test keep a handle on the world it is serving. */
  readonly simulation?: GameSimulation;
  /** Lets a test reach the join deadline without the wait. */
  readonly joinDeadlineMs?: number;
  /** Lets a test reach the end of a restart vote without the wait. */
  readonly restartVoteMs?: number;
}

export interface RunningGameServer {
  readonly port: number;
  close(): Promise<void>;
}

/** Spends one packet from the client's allowance. False means drop it unread. */
function takePacketAllowance(client: Client, now: number): boolean {
  const refill = ((now - client.allowanceAt) / 1000) * PACKETS_PER_SEC;
  client.packetAllowance = Math.min(PACKET_BURST, client.packetAllowance + refill);
  client.allowanceAt = now;
  if (client.packetAllowance < 1) return false;
  client.packetAllowance -= 1;
  return true;
}

export function startGameServer(options: GameServerOptions): Promise<RunningGameServer> {
  const sim = options.simulation ?? new GameSimulation({ seed: options.seed ?? randomInt(0x7fffffff), workbench: 'timed' });
  const joinDeadlineMs = options.joinDeadlineMs ?? JOIN_DEADLINE_MS;
  const restartVoteMs = options.restartVoteMs ?? RESTART_VOTE_MS;
  const clients = new Set<Client>();
  const wss = new WebSocketServer({ port: options.port, maxPayload: MAX_PACKET_BYTES });
  let tickTimer: NodeJS.Timeout | null = null;
  let nextTickAt = 0;
  let restartVote: NodeJS.Timeout | null = null;

  const joined = (): Client[] => [...clients].filter((client) => client.playerId !== null);
  const unjoined = (): Client[] => [...clients].filter((client) => client.playerId === null);

  function send(client: Client, packet: ServerPacket): void {
    if (client.socket.readyState === WebSocket.OPEN) client.socket.send(JSON.stringify(packet));
  }

  /** Each client gets its own cut of the frame, unless it is already too far behind to take one. */
  function sendFrame(frame: SnapshotPacket): void {
    for (const client of joined()) {
      const writable = client.socket.readyState === WebSocket.OPEN && client.socket.bufferedAmount < MAX_BUFFERED_BYTES;
      if (writable) client.socket.send(JSON.stringify(viewFor(frame, client.playerId as string)));
    }
  }

  function runDueTicks(): void {
    const now = performance.now();
    if (now - nextTickAt > MAX_LAG_MS) nextTickAt = now;
    for (let ticks = 0; ticks < MAX_CATCH_UP_TICKS && now >= nextTickAt; ticks++) {
      sim.step();
      sendFrame(sim.snapshot());
      nextTickAt += TICK_MS;
    }
    tickTimer = setTimeout(runDueTicks, Math.max(0, nextTickAt - performance.now()));
  }

  function startTicking(): void {
    if (tickTimer) return;
    nextTickAt = performance.now();
    runDueTicks();
  }

  function stopTicking(): void {
    if (tickTimer) clearTimeout(tickTimer);
    tickTimer = null;
  }

  function join(client: Client, name: string, token: string, character?: number, difficulty?: DifficultyId): void {
    if (client.playerId) return;
    // A dropped link can outlive its refresh: the old socket goes and the new one takes that body over.
    const heldBy = sim.playerWithToken(token);
    const stale = joined().find((other) => other.playerId === heldBy);
    if (!stale && sim.playerCount >= MAX_PLAYERS) {
      client.socket.close(ROOM_FULL_CODE, 'room full');
      return;
    }
    const id = randomUUID();
    // The first player into an empty room sets how hard the run is.
    if (difficulty && sim.playerCount === 0) sim.setDifficulty(difficulty);
    sim.addPlayer(id, name, token, character);
    client.playerId = id;
    clearTimeout(client.joinDeadline);
    send(client, { type: 'welcome', yourId: id, tickRate: TICK_RATE, mapSeed: sim.map.seed, difficulty: sim.difficulty });
    stale?.socket.terminate();
    startTicking();
  }

  function endRestartVote(): void {
    if (restartVote) clearTimeout(restartVote);
    restartVote = null;
  }

  function restartRun(): void {
    endRestartVote();
    for (const client of joined()) client.wantsRestart = false;
    sim.restart();
  }

  /** The run restarts once everyone still here has asked, or when the first asker's wait runs out. */
  function restartIfAgreed(): void {
    const room = joined();
    const agreed = sim.phase === 'gameover' && room.length > 0 && room.every((client) => client.wantsRestart);
    if (agreed) restartRun();
  }

  function restartAfterWaiting(): void {
    restartVote = null;
    const stillWanted = sim.phase === 'gameover' && joined().some((client) => client.wantsRestart);
    if (stillWanted) restartRun();
  }

  function askToRestart(client: Client): void {
    if (sim.phase !== 'gameover') return;
    client.wantsRestart = true;
    restartIfAgreed();
    const waiting = sim.phase === 'gameover' && restartVote === null;
    if (waiting) restartVote = setTimeout(restartAfterWaiting, restartVoteMs);
  }

  function receive(client: Client, packet: ClientPacket): void {
    if (packet.type === 'join') join(client, packet.name, packet.token, packet.character, packet.difficulty);
    else if (client.playerId === null) return;
    else if (packet.type === 'input') sim.setInput(client.playerId, packet.input);
    else if (packet.type === 'bench') sim.benchCommand(client.playerId, packet.action);
    else askToRestart(client);
  }

  function disconnect(client: Client): void {
    clients.delete(client);
    clearTimeout(client.joinDeadline);
    if (client.playerId === null) return;
    sim.removePlayer(client.playerId);
    for (const other of joined()) send(other, { type: 'player_disconnected', playerId: client.playerId });
    if (sim.playerCount === 0) {
      stopTicking();
      endRestartVote();
      sim.restart();
      return;
    }
    restartIfAgreed();
  }

  wss.on('connection', (socket, request) => {
    const address = request.socket.remoteAddress ?? '';
    const waiting = unjoined();
    const waitingHere = waiting.filter((client) => client.address === address).length;
    const tooManyWaiting = waiting.length >= MAX_UNJOINED_SOCKETS || waitingHere >= MAX_UNJOINED_PER_ADDRESS;
    if (tooManyWaiting) {
      socket.on('error', () => undefined);
      socket.close(SERVER_BUSY_CODE, 'server busy');
      return;
    }
    const client: Client = {
      socket,
      address,
      playerId: null,
      alive: true,
      wantsRestart: false,
      packetAllowance: PACKET_BURST,
      allowanceAt: performance.now(),
      joinDeadline: setTimeout(() => socket.close(JOIN_TIMEOUT_CODE, 'no join'), joinDeadlineMs),
    };
    clients.add(client);

    socket.on('message', (data, isBinary) => {
      // On a slow link the pong queues behind the frames, but its input still arrives.
      client.alive = true;
      const admitted = !isBinary && takePacketAllowance(client, performance.now());
      if (!admitted) return;
      const packet = parseClientPacket(data.toString());
      if (packet) receive(client, packet);
    });
    socket.on('pong', () => {
      client.alive = true;
    });
    socket.on('close', () => disconnect(client));
    // Oversized frames and protocol errors land here; ws closes the socket for us.
    socket.on('error', (error) => console.warn(`[zombie-server] client error: ${error.message}`));
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.alive) {
        client.socket.terminate();
        continue;
      }
      client.alive = false;
      client.socket.ping();
    }
  }, HEARTBEAT_MS);

  function close(): Promise<void> {
    stopTicking();
    endRestartVote();
    clearInterval(heartbeat);
    for (const client of clients) {
      clearTimeout(client.joinDeadline);
      client.socket.terminate();
    }
    return new Promise((resolve) => wss.close(() => resolve()));
  }

  return new Promise((resolve, reject) => {
    wss.once('error', reject);
    wss.once('listening', () => {
      wss.off('error', reject);
      wss.on('error', (error) => console.error(`[zombie-server] ${error.message}`));
      const address = wss.address();
      const port = typeof address === 'object' && address ? address.port : options.port;
      resolve({ port, close });
    });
  });
}

const launchedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (launchedDirectly) {
  const port = Number(process.env.ZOMBIE_PORT) || DEFAULT_SERVER_PORT;
  const server = await startGameServer({ port });
  console.log(`[zombie-server] listening on ws://0.0.0.0:${server.port}`);
  const shutdown = () => void server.close().then(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
