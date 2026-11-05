import { afterEach, describe, expect, it } from 'vitest';
import { parseClientPacket, sanitiseName } from '../server/packets.ts';
import { startGameServer } from '../server/server.ts';
import type { RunningGameServer } from '../server/server.ts';
import { JOIN_TOKEN_MAX_LENGTH, MAX_PLAYERS, TICK_RATE, VIEWER_RANGE } from '../shared/constants.ts';
import { hurtPlayer } from '../shared/player-health.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { TestClient } from './helpers/ws-client.ts';
import { addZombie, input, stateOf } from './helpers/sim-harness.ts';

/** Far more packets than any honest client sends in a burst. */
const FLOOD_PACKETS = 1500;

describe('packet validation', () => {
  const good = { seq: 1, up: false, down: false, left: false, right: true, angle: 1, shoot: false, reload: false, weapon: null, melee: true, heal: false };

  it('accepts well-formed packets', () => {
    expect(parseClientPacket(JSON.stringify({ type: 'input', input: good }))).toEqual({ type: 'input', input: good });
    expect(parseClientPacket('{"type":"restart"}')).toEqual({ type: 'restart' });
    expect(parseClientPacket('{"type":"join","name":"Ann","token":"t1"}')).toEqual({ type: 'join', name: 'Ann', token: 't1' });
  });

  it.each([
    ['not json', '{nope'],
    ['a non-object', '42'],
    ['an array', '[]'],
    ['null', 'null'],
    ['an unknown type', '{"type":"cheat"}'],
    ['a join without a name', '{"type":"join","token":"t1"}'],
    ['a join with a numeric name', '{"type":"join","name":5,"token":"t1"}'],
    ['a join without a token', '{"type":"join","name":"Ann"}'],
    ['a join with a numeric token', '{"type":"join","name":"Ann","token":5}'],
    ['a join with an empty token', '{"type":"join","name":"Ann","token":""}'],
    ['a join with an oversized token', JSON.stringify({ type: 'join', name: 'Ann', token: 'x'.repeat(JOIN_TOKEN_MAX_LENGTH + 1) })],
    ['input without a body', '{"type":"input"}'],
    ['a string angle', JSON.stringify({ type: 'input', input: { ...good, angle: 'east' } })],
    ['a null angle (JSON NaN)', JSON.stringify({ type: 'input', input: { ...good, angle: null } })],
    ['a negative seq', JSON.stringify({ type: 'input', input: { ...good, seq: -1 } })],
    ['a non-boolean flag', JSON.stringify({ type: 'input', input: { ...good, shoot: 1 } })],
    ['a non-boolean shove', JSON.stringify({ type: 'input', input: { ...good, melee: 'yes' } })],
    ['a non-boolean heal', JSON.stringify({ type: 'input', input: { ...good, heal: 1 } })],
    ['an unknown weapon', JSON.stringify({ type: 'input', input: { ...good, weapon: 'railgun' } })],
    ['a missing flag', JSON.stringify({ type: 'input', input: { seq: 1, angle: 0 } })],
  ])('drops %s', (_label, raw) => {
    expect(parseClientPacket(raw)).toBeNull();
  });

  it('sanitises and truncates names', () => {
    expect(sanitiseName('  Ann\u0000 \n Lee  ')).toBe('Ann Lee');
    expect(sanitiseName('x'.repeat(40))).toBe('x'.repeat(16));
    expect(sanitiseName('\u0007\u0008')).toBe('Survivor');
    expect(sanitiseName('')).toBe('Survivor');
    expect([...sanitiseName('🧟'.repeat(20))].length).toBe(16);
  });
});

describe('game server', () => {
  let server: RunningGameServer;
  const clients: TestClient[] = [];

  const connect = (): TestClient => {
    const client = new TestClient(server.port);
    clients.push(client);
    return client;
  };

  afterEach(async () => {
    for (const client of clients.splice(0)) client.socket.terminate();
    await server.close();
  });

  it('welcomes a client and streams snapshots at the tick rate', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const client = connect();
    const id = await client.join('A\u0000nn');
    const welcome = client.received.find((packet) => packet.type === 'welcome');
    expect(welcome).toMatchObject({ yourId: id, tickRate: TICK_RATE, mapSeed: 11 });

    const first = await client.until(() => client.lastSnapshot);
    expect(first.players[0]).toMatchObject({ id, name: 'Ann' });
    const startTick = first.tick;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const elapsed = (client.lastSnapshot?.tick ?? 0) - startTick;
    expect(elapsed).toBeGreaterThan(TICK_RATE * 0.8);
    expect(elapsed).toBeLessThan(TICK_RATE * 1.2);
  });

  it('applies input and survives junk from a client', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const client = connect();
    await client.join();
    const before = await client.until(() => client.lastSnapshot);

    client.send('{nope');
    client.send('[1,2,3]');
    client.send({ type: 'input', input: { seq: 'x' } });
    client.socket.send(Buffer.from([1, 2, 3]));
    client.send({ type: 'input', input: input({ seq: 1, right: true }) });

    const moved = await client.until(() => {
      const snapshot = client.lastSnapshot;
      return snapshot && snapshot.players[0].x > before.players[0].x + 5 && snapshot;
    });
    expect(moved.players[0].lastInputSeq).toBe(1);
    expect(client.closeCode).toBeNull();
  });

  it('drops an oversized frame from one client without hurting the others', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const bad = connect();
    const good = connect();
    await bad.join();
    await good.join();
    bad.send('x'.repeat(100000));
    await bad.until(() => bad.closeCode !== null);
    const after = good.lastSnapshot?.tick ?? 0;
    await good.until(() => (good.lastSnapshot?.tick ?? 0) > after + 3);
    expect(good.closeCode).toBeNull();
    const players = await good.until(() => good.lastSnapshot?.players.length === 1 && good.lastSnapshot);
    expect(players.players.length).toBe(1);
  });

  it('closes the fifth player with code 4000', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const room = Array.from({ length: MAX_PLAYERS }, () => connect());
    for (const client of room) await client.join();
    const extra = connect();
    await extra.opened();
    extra.send({ type: 'join', name: 'Late', token: 'late-tab' });
    const closed = await extra.until(() => extra.closeCode);
    expect(closed).toBe(4000);
    expect(room[0].closeCode).toBeNull();
  });

  it('lets a dropped player back into a full room', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const room = Array.from({ length: MAX_PLAYERS }, () => connect());
    for (const client of room.slice(1)) await client.join();
    await room[0].join('Bea', 'my-tab');

    const back = connect();
    await back.join('Bea', 'my-tab');
    expect(await room[0].until(() => room[0].closeCode)).not.toBe(4000);
    expect(back.closeCode).toBeNull();
    expect(simulation.playerCount).toBe(MAX_PLAYERS);
  });

  it('tells the room when someone leaves', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const stays = connect();
    const leaves = connect();
    await stays.join();
    const id = await leaves.join();
    leaves.socket.close();
    await stays.until(() => stays.received.find((packet) => packet.type === 'player_disconnected' && packet.playerId === id));
    await stays.until(() => stays.lastSnapshot?.players.length === 1);
  });

  it('honours restart only in game over', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const client = connect();
    await client.join();
    await client.until(() => (client.lastSnapshot?.tick ?? 0) > 12);
    const lead = client.lastSnapshot?.intermission ?? 0;

    client.send({ type: 'restart' });
    await client.until(() => (client.lastSnapshot?.tick ?? 0) > 20);
    expect(client.lastSnapshot?.intermission).toBeLessThan(lead);

    const state = stateOf(simulation);
    hurtPlayer(state, state.players[0], 1000);
    await client.until(() => client.lastSnapshot?.phase === 'gameover');
    expect(client.received.some((p) => p.type === 'snapshot' && p.events.some((e) => e.type === 'game_over'))).toBe(true);

    client.send({ type: 'restart' });
    const fresh = await client.until(() => client.lastSnapshot?.phase === 'intermission' && client.lastSnapshot);
    expect(fresh.players[0].status).toBe('alive');
    expect(fresh.gameOver).toBeNull();
  });

  it('pauses and resets the run when the room empties', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const first = connect();
    await first.join();
    await first.until(() => (first.lastSnapshot?.tick ?? 0) > 5);
    const state = stateOf(simulation);
    state.wave = 4;
    state.phase = 'wave';
    first.socket.close();
    await first.until(() => simulation.playerCount === 0);

    const pausedAt = state.tick;
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(state.tick).toBe(pausedAt);
    expect(state.wave).toBe(0);
    expect(simulation.phase).toBe('intermission');

    const second = connect();
    await second.join();
    await second.until(() => (second.lastSnapshot?.tick ?? 0) > pausedAt);
    expect(second.lastSnapshot?.wave).toBe(0);
  });

  it('takes a refreshed tab back to where it was, with a token no snapshot shows', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const stays = connect();
    const refreshes = connect();
    await stays.join();
    await refreshes.join('Bea', 'my-tab');
    const state = stateOf(simulation);
    state.wave = 1;
    state.players[1].health = 37;
    state.players[1].score = 90;
    await stays.until(() => stays.lastSnapshot?.players.some((p) => p.score === 90));
    refreshes.socket.close();
    await stays.until(() => stays.lastSnapshot?.players.length === 1);

    const back = connect();
    const id = await back.join('Bea', 'my-tab');
    const frame = await back.until(() => back.lastSnapshot?.players.find((p) => p.id === id));
    expect(frame).toMatchObject({ health: 37, score: 90 });
    expect(JSON.stringify(back.received)).not.toContain('my-tab');

    const stranger = connect();
    const strangerId = await stranger.join('Cy', 'other-tab');
    const fresh = await stranger.until(() => stranger.lastSnapshot?.players.find((p) => p.id === strangerId));
    expect(fresh).toMatchObject({ health: 50, reserve: 0 });
  });

  it('restarts only once everyone in the room has asked', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const first = connect();
    const second = connect();
    await first.join();
    await second.join();
    const state = stateOf(simulation);
    for (const p of state.players) hurtPlayer(state, p, 1e6);
    state.players[0].status = 'dead';
    await first.until(() => first.lastSnapshot?.phase === 'gameover');

    first.send({ type: 'restart' });
    first.send({ type: 'restart' });
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(simulation.phase).toBe('gameover');

    second.send({ type: 'restart' });
    const fresh = await first.until(() => first.lastSnapshot?.phase === 'intermission' && first.lastSnapshot);
    expect(fresh.gameOver).toBeNull();
    expect(fresh.players.every((p) => p.status === 'alive')).toBe(true);
  });

  it('stops waiting on a silent teammate once the vote runs out', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation, restartVoteMs: 100 });
    const asks = connect();
    const silent = connect();
    await asks.join();
    await silent.join();
    const state = stateOf(simulation);
    for (const p of state.players) {
      hurtPlayer(state, p, 1e6);
      p.status = 'dead';
    }
    await asks.until(() => asks.lastSnapshot?.phase === 'gameover');

    asks.send({ type: 'restart' });
    await silent.until(() => silent.lastSnapshot?.phase === 'intermission');
    expect(silent.lastSnapshot?.gameOver).toBeNull();
  });

  it('lets a vote lapse when the one who asked has gone', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation, restartVoteMs: 60 });
    const asks = connect();
    const stays = connect();
    const third = connect();
    await asks.join();
    await stays.join();
    await third.join();
    const state = stateOf(simulation);
    for (const p of state.players) {
      hurtPlayer(state, p, 1e6);
      p.status = 'dead';
    }
    await asks.until(() => asks.lastSnapshot?.phase === 'gameover');

    asks.send({ type: 'restart' });
    await asks.until(() => simulation.phase === 'gameover');
    asks.socket.close();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(simulation.phase).toBe('gameover');
  });

  it('hands a body to the new socket when the old one has dropped without a word', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const stays = connect();
    const dropped = connect();
    await stays.join();
    await dropped.join('Bea', 'my-tab');
    const state = stateOf(simulation);
    state.wave = 1;
    state.players[1].health = 33;
    state.players[1].score = 500;

    const back = connect();
    const id = await back.join('Bea', 'my-tab');
    await dropped.until(() => dropped.closeCode !== null);
    await stays.until(() => stays.received.some((packet) => packet.type === 'player_disconnected'));
    const frame = await back.until(() => back.lastSnapshot?.players.find((p) => p.id === id));
    expect(frame).toMatchObject({ health: 33, score: 500 });
    expect(simulation.playerCount).toBe(2);
  });

  it('counts the vote again when someone who had not asked leaves', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const asks = connect();
    const leaves = connect();
    await asks.join();
    await leaves.join();
    const state = stateOf(simulation);
    for (const p of state.players) p.status = 'dead';
    await asks.until(() => asks.lastSnapshot?.phase === 'gameover');
    asks.send({ type: 'restart' });
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(simulation.phase).toBe('gameover');

    leaves.socket.close();
    await asks.until(() => asks.lastSnapshot?.phase === 'intermission');
  });

  it('forgets a vote cast before the next run ends', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const first = connect();
    const second = connect();
    await first.join();
    await second.join();
    const state = stateOf(simulation);
    const endRun = async (): Promise<void> => {
      for (const p of state.players) p.status = 'dead';
      await first.until(() => first.lastSnapshot?.phase === 'gameover');
    };
    await endRun();
    first.send({ type: 'restart' });
    second.send({ type: 'restart' });
    await first.until(() => first.lastSnapshot?.phase === 'intermission');
    await endRun();
    second.send({ type: 'restart' });
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(simulation.phase).toBe('gameover');
  });

  it('brings a game over caused by a disconnect to the client left behind', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const spectator = connect();
    const last = connect();
    await spectator.join();
    await last.join();
    const state = stateOf(simulation);
    state.players[0].status = 'dead';
    const before = await spectator.until(() => spectator.lastSnapshot?.players[0].status === 'dead' && spectator.lastSnapshot);
    last.socket.close();
    const over = await spectator.until(() => spectator.lastSnapshot?.phase === 'gameover' && spectator.lastSnapshot);
    expect(over.tick).toBeGreaterThan(before.tick);
    expect(spectator.received.some((p) => p.type === 'snapshot' && p.events.some((e) => e.type === 'game_over'))).toBe(true);
  });

  it('sends each client only what is around them, and all of the room', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const here = connect();
    const there = connect();
    const hereId = await here.join();
    await there.join();
    const state = stateOf(simulation);
    state.zombies = [];
    state.pickups = [];
    const [a, b] = state.players;
    a.x = 1000;
    a.y = 1000;
    b.x = 1000 + VIEWER_RANGE * 3;
    b.y = 1000;
    const zombie = addZombie(state, 'walker', a.x + 40, a.y);
    zombie.speed = 0;
    const seen = await here.until(() => here.lastSnapshot?.zombies.length === 1 && here.lastSnapshot);
    expect(seen.zombies[0].id).toBe(zombie.id);
    expect(seen.players.length).toBe(2);
    const elsewhere = await there.until(() => there.lastSnapshot?.players.find((p) => p.id === hereId)?.x === 1000 && there.lastSnapshot);
    expect(elsewhere.zombies.length).toBe(0);
  });

  it('drops a flood of packets, and takes the same client again when it calms down', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const flooder = connect();
    await flooder.join();
    await flooder.until(() => flooder.lastSnapshot);
    for (let seq = 1; seq <= FLOOD_PACKETS; seq++) flooder.send({ type: 'input', input: input({ seq }) });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const [p] = stateOf(simulation).players;
    expect(p.queuedSeq).toBeLessThan(FLOOD_PACKETS);
    expect(flooder.closeCode).toBeNull();

    flooder.send({ type: 'input', input: input({ seq: FLOOD_PACKETS + 1 }) });
    await flooder.until(() => p.queuedSeq === FLOOD_PACKETS + 1);
  });

  it('lets through a client sending at the real input rate', async () => {
    const simulation = new GameSimulation({ seed: 11 });
    server = await startGameServer({ port: 0, simulation });
    const client = connect();
    await client.join();
    for (let seq = 1; seq <= 90; seq++) client.send({ type: 'input', input: input({ seq }) });
    const [p] = stateOf(simulation).players;
    await client.until(() => p.queuedSeq === 90);
  });

  it('closes a socket that has not joined by the deadline', async () => {
    server = await startGameServer({ port: 0, seed: 11, joinDeadlineMs: 40 });
    const idle = connect();
    await idle.opened();
    const code = await idle.until(() => idle.closeCode);
    expect(code).toBe(4002);
  });

  it('leaves a joined socket alone when the deadline passes', async () => {
    server = await startGameServer({ port: 0, seed: 11, joinDeadlineMs: 40 });
    const client = connect();
    await client.join();
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(client.closeCode).toBeNull();
  });

  it('turns away one address past its share of those waiting to join, and a player can still get in after', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const waiting = Array.from({ length: 4 }, () => connect());
    await Promise.all(waiting.map((client) => client.opened()));
    const extra = connect();
    expect(await extra.until(() => extra.closeCode)).toBe(4001);

    waiting[0].socket.close();
    await waiting[0].until(() => waiting[0].closeCode !== null);
    const player = connect();
    await player.join();
    expect(player.closeCode).toBeNull();
  });

  it('ignores input from a socket that never joined', async () => {
    server = await startGameServer({ port: 0, seed: 11 });
    const client = connect();
    await client.opened();
    client.send({ type: 'input', input: input({ seq: 1 }) });
    client.send({ type: 'restart' });
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(client.received).toEqual([]);
    expect(client.closeCode).toBeNull();
  });
});
