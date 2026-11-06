import { randomInt } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { DEFAULT_SERVER_PORT } from '../shared/constants.ts';
import { GameSimulation } from '../shared/simulation.ts';
import {
  HEARTBEAT_MS,
  JOIN_DEADLINE_MS,
  JOIN_TIMEOUT_CODE,
  MAX_PACKET_BYTES,
  MAX_UNJOINED_PER_ADDRESS,
  MAX_UNJOINED_SOCKETS,
  PACKET_BURST,
  RESTART_VOTE_MS,
  SERVER_BUSY_CODE,
  takePacketAllowance,
} from './limits.ts';
import { parseClientPacket } from './packets.ts';
import { createRoom, type Client } from './room.ts';

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

export function startGameServer(options: GameServerOptions): Promise<RunningGameServer> {
  const sim = options.simulation ?? new GameSimulation({ seed: options.seed ?? randomInt(0x7fffffff), workbench: 'timed' });
  const joinDeadlineMs = options.joinDeadlineMs ?? JOIN_DEADLINE_MS;
  const room = createRoom(sim, options.restartVoteMs ?? RESTART_VOTE_MS);
  const clients = room.clients;
  const wss = new WebSocketServer({ port: options.port, maxPayload: MAX_PACKET_BYTES });

  wss.on('connection', (socket, request) => {
    const address = request.socket.remoteAddress ?? '';
    const waiting = room.unjoined();
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
      if (packet) room.receive(client, packet);
    });
    socket.on('pong', () => {
      client.alive = true;
    });
    socket.on('close', () => room.disconnect(client));
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
    room.shutdown();
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
