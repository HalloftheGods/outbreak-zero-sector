import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { MAX_PLAYERS, TICK_RATE } from '../shared/constants.ts';
import type { DifficultyId } from '../shared/difficulty.ts';
import type { JoinHome } from '../shared/home-protocol.ts';
import type { ClientPacket, ServerPacket, SnapshotPacket } from '../shared/protocol.ts';
import type { GameSimulation } from '../shared/simulation.ts';
import { viewFor } from '../shared/snapshot-view.ts';
import { MAX_BUFFERED_BYTES, MAX_CATCH_UP_TICKS, MAX_LAG_MS, ROOM_FULL_CODE } from './limits.ts';
import { createRestartVote } from './restart-vote.ts';

const TICK_MS = 1000 / TICK_RATE;

export interface Client {
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

export interface Room {
  readonly clients: Set<Client>;
  unjoined(): Client[];
  receive(client: Client, packet: ClientPacket): void;
  disconnect(client: Client): void;
  /** Stops ticking and any pending vote. */
  shutdown(): void;
}

export function createRoom(sim: GameSimulation, restartVoteMs: number): Room {
  const clients = new Set<Client>();
  let tickTimer: NodeJS.Timeout | null = null;
  let nextTickAt = 0;

  const joined = (): Client[] => [...clients].filter((client) => client.playerId !== null);
  const unjoined = (): Client[] => [...clients].filter((client) => client.playerId === null);
  const vote = createRestartVote(sim, joined, restartVoteMs);

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

  function join(client: Client, name: string, token: string, character?: number, difficulty?: DifficultyId, home?: JoinHome): void {
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
    // After that restart, which lets every body go, and before addPlayer takes this one back.
    const resumed = sim.hasBodyFor(token);
    sim.addPlayer(id, name, token, character, home);
    client.playerId = id;
    clearTimeout(client.joinDeadline);
    send(client, { type: 'welcome', yourId: id, tickRate: TICK_RATE, mapSeed: sim.map.seed, difficulty: sim.difficulty, ...(resumed ? { resumed } : {}) });
    stale?.socket.terminate();
    startTicking();
  }

  function receive(client: Client, packet: ClientPacket): void {
    if (packet.type === 'join') join(client, packet.name, packet.token, packet.character, packet.difficulty, packet.home);
    else if (client.playerId === null) return;
    else if (packet.type === 'input') sim.setInput(client.playerId, packet.input);
    else if (packet.type === 'bench') sim.benchCommand(client.playerId, packet.action);
    else if (packet.type === 'home') sim.homeCommand(client.playerId, packet.action);
    else vote.ask(client);
  }

  function disconnect(client: Client): void {
    clients.delete(client);
    clearTimeout(client.joinDeadline);
    if (client.playerId === null) return;
    sim.removePlayer(client.playerId);
    for (const other of joined()) send(other, { type: 'player_disconnected', playerId: client.playerId });
    if (sim.playerCount === 0) {
      stopTicking();
      vote.end();
      sim.restart();
      return;
    }
    vote.restartIfAgreed();
  }

  function shutdown(): void {
    stopTicking();
    vote.end();
  }

  return { clients, unjoined, receive, disconnect, shutdown };
}
