import { afterEach, describe, expect, it } from 'vitest';
import { ROOM_FULL_CODE } from '../server/limits.ts';
import { parseClientPacket } from '../server/packets.ts';
import { startGameServer } from '../server/server.ts';
import type { RunningGameServer } from '../server/server.ts';
import { BUNKER_SEED } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import type { RoomPacket, ServerPacket, WelcomePacket } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';
import { TestClient } from './helpers/ws-client.ts';

const isRoom = (packet: ServerPacket): packet is RoomPacket => packet.type === 'room';
const isWelcome = (packet: ServerPacket): packet is WelcomePacket => packet.type === 'welcome';

const roomsHeard = (client: TestClient): RoomPacket['style'][] => client.received.filter(isRoom).map((packet) => packet.style);
const welcomeOf = (client: TestClient): WelcomePacket | undefined => client.received.find(isWelcome);

describe('the style in a join', () => {
  it('is kept when it is a style, and dropped when it is not', () => {
    const join = { type: 'join', name: 'Ann', token: 't1' };
    expect(parseClientPacket(JSON.stringify({ ...join, style: 'campaign' }))).toMatchObject({ style: 'campaign' });
    expect(parseClientPacket(JSON.stringify({ ...join, style: 'arcade' }))).toMatchObject({ style: 'arcade' });
    expect(parseClientPacket(JSON.stringify({ ...join, style: 'endless' }))).toEqual(join);
    expect(parseClientPacket(JSON.stringify(join))).toEqual(join);
  });
});

describe('a room\'s style', () => {
  let server: RunningGameServer;
  let sim: GameSimulation;
  const clients: TestClient[] = [];

  async function boot(): Promise<void> {
    sim = new GameSimulation({ seed: SEED, workbench: 'timed' });
    server = await startGameServer({ port: 0, simulation: sim, restartVoteMs: 50 });
  }

  /** A socket that has heard its first word from the room, and no more. */
  async function arrive(): Promise<TestClient> {
    const client = new TestClient(server.port);
    clients.push(client);
    await client.opened();
    await client.until(() => roomsHeard(client).length > 0);
    return client;
  }

  async function leave(client: TestClient): Promise<void> {
    client.socket.close();
    await client.until(() => client.closeCode !== null);
  }

  /** The server has seen the leaver's socket go. */
  const roomEmpties = async (client: TestClient): Promise<void> => {
    await client.until(() => sim.playerCount === 0);
  };

  afterEach(async () => {
    for (const client of clients.splice(0)) client.socket.terminate();
    await server.close();
  });

  it('tells a new socket before it joins: null for an empty room', async () => {
    await boot();
    const first = await arrive();
    expect(first.received).toEqual([{ type: 'room', style: null }]);
  });

  it('is chosen by whoever opens the room, and everyone after hears it first', async () => {
    await boot();
    const opener = await arrive();
    await opener.join('Ann', 'tok-a', 'campaign');
    expect(welcomeOf(opener)?.mapSeed).toBe(BUNKER_SEED);

    const joiner = await arrive();
    expect(roomsHeard(joiner)).toEqual(['campaign']);
    await joiner.join('Bo', 'tok-b', 'campaign');
    expect(welcomeOf(joiner)?.mapSeed).toBe(BUNKER_SEED);
  });

  it('stays Arcade for an Arcade opener, in a town and with no home on anyone', async () => {
    await boot();
    const opener = await arrive();
    await opener.join('Ann', 'tok-a', 'arcade');
    expect(welcomeOf(opener)?.mapSeed).not.toBe(BUNKER_SEED);
    const joiner = await arrive();
    expect(roomsHeard(joiner)).toEqual(['arcade']);
    await joiner.join('Bo', 'tok-b', 'arcade');
    const frame = await joiner.until(() => joiner.lastSnapshot);
    expect(frame.home).toBeUndefined();
    expect(frame.players.every((player) => player.home === undefined)).toBe(true);
  });

  it('does not let a join in under another style, and tells it what the room plays', async () => {
    await boot();
    const opener = await arrive();
    await opener.join('Ann', 'tok-a', 'campaign');

    const joiner = await arrive();
    joiner.send({ type: 'join', name: 'Bo', token: 'tok-b', style: 'arcade' });
    await joiner.until(() => roomsHeard(joiner).length === 2);
    expect(roomsHeard(joiner)).toEqual(['campaign', 'campaign']);
    expect(welcomeOf(joiner)).toBeUndefined();
    expect(sim.playerCount).toBe(1);

    await joiner.join('Bo', 'tok-b', 'campaign');
    expect(sim.playerCount).toBe(2);
  });

  it('settles two sockets that both found the room empty: the second follows the first', async () => {
    await boot();
    const first = await arrive();
    const second = await arrive();
    expect(roomsHeard(second)).toEqual([null]);
    await first.join('Ann', 'tok-a', 'arcade');

    second.send({ type: 'join', name: 'Bo', token: 'tok-b', style: 'campaign', home: { loadout: emptyLoadout(), highest: 1 } });
    await second.until(() => roomsHeard(second).length === 2);
    expect(roomsHeard(second)).toEqual([null, 'arcade']);
    await second.join('Bo', 'tok-b', 'arcade');
    expect(sim.playsHome).toBe(false);
  });

  it('is free to change once the room empties', async () => {
    await boot();
    const opener = await arrive();
    await opener.join('Ann', 'tok-a', 'campaign');
    await leave(opener);
    await roomEmpties(opener);

    const next = await arrive();
    expect(roomsHeard(next)).toEqual([null]);
    await next.join('Bo', 'tok-b', 'arcade');
    expect(welcomeOf(next)?.mapSeed).not.toBe(BUNKER_SEED);
    expect(sim.playsHome).toBe(false);
    await leave(next);
    await roomEmpties(next);

    const again = await arrive();
    await again.join('Cy', 'tok-c', 'campaign');
    expect(welcomeOf(again)?.mapSeed).toBe(BUNKER_SEED);
  });

  it('still takes the opener\'s difficulty when the style changes with it', async () => {
    await boot();
    const opener = await arrive();
    opener.send({ type: 'join', name: 'Ann', token: 'tok-a', style: 'campaign', difficulty: 'undead_tired' });
    await opener.until(() => welcomeOf(opener));
    expect(welcomeOf(opener)).toMatchObject({ difficulty: 'undead_tired', mapSeed: BUNKER_SEED });
    expect(sim.difficulty).toBe('undead_tired');
  });

  it('plays a client from before styles as Arcade, and turns it away from a Campaign room', async () => {
    await boot();
    const old = await arrive();
    await old.join('Ann', 'tok-a');
    expect(sim.playsHome).toBe(false);
    await leave(old);
    await roomEmpties(old);

    const opener = await arrive();
    await opener.join('Bo', 'tok-b', 'campaign');
    const late = await arrive();
    late.send({ type: 'join', name: 'Cy', token: 'tok-c' });
    await late.until(() => late.closeCode !== null);
    expect(late.closeCode).toBe(ROOM_FULL_CODE);
    expect(sim.playerCount).toBe(1);
  });

  it('holds through a refresh: the same token comes back to the same room, and an Arcade body is the same body', async () => {
    await boot();
    const stayer = await arrive();
    await stayer.join('Ann', 'tok-a', 'arcade');
    const leaver = await arrive();
    await leaver.join('Bo', 'tok-b', 'arcade');
    await leave(leaver);
    await stayer.until(() => sim.playerCount === 1);

    const back = await arrive();
    expect(roomsHeard(back)).toEqual(['arcade']);
    await back.join('Bo', 'tok-b', 'arcade');
    expect(welcomeOf(back)?.resumed).toBe(true);
    expect(sim.playsHome).toBe(false);
  });

  it('holds through a refresh in a Campaign room, which takes the player back as a newcomer from their save', async () => {
    await boot();
    const stayer = await arrive();
    await stayer.join('Ann', 'tok-a', 'campaign');
    const leaver = await arrive();
    await leaver.join('Bo', 'tok-b', 'campaign');
    await leave(leaver);
    await stayer.until(() => sim.playerCount === 1);

    const back = await arrive();
    expect(roomsHeard(back)).toEqual(['campaign']);
    await back.join('Bo', 'tok-b', 'campaign');
    expect(welcomeOf(back)?.resumed).toBeUndefined();
    expect(sim.playsHome).toBe(true);
    expect(sim.playerCount).toBe(2);
  });

  it('keeps its style through a restart vote, and the vote does not free it', async () => {
    await boot();
    const ann = await arrive();
    const annId = await ann.join('Ann', 'tok-a', 'arcade');
    const bo = await arrive();
    const boId = await bo.join('Bo', 'tok-b', 'arcade');
    for (const id of [annId, boId]) {
      const player = stateOf(sim).players.find((each) => each.id === id);
      Object.assign(player!, { status: 'dead' });
    }
    await ann.until(() => sim.phase === 'gameover');
    ann.send({ type: 'restart' });
    bo.send({ type: 'restart' });
    await ann.until(() => sim.phase !== 'gameover');
    expect(sim.playsHome).toBe(false);

    const joiner = await arrive();
    expect(roomsHeard(joiner)).toEqual(['arcade']);
  });

  it('frees the room when the last voter leaves', async () => {
    await boot();
    const ann = await arrive();
    const annId = await ann.join('Ann', 'tok-a', 'arcade');
    const player = stateOf(sim).players.find((each) => each.id === annId);
    Object.assign(player!, { status: 'dead' });
    await ann.until(() => sim.phase === 'gameover');
    ann.send({ type: 'restart' });
    await leave(ann);
    await roomEmpties(ann);

    const next = await arrive();
    expect(roomsHeard(next)).toEqual([null]);
    await next.join('Bo', 'tok-b', 'campaign');
    expect(welcomeOf(next)?.mapSeed).toBe(BUNKER_SEED);
  });
});
