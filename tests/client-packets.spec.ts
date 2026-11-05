import { describe, expect, it } from 'vitest';
import type { PlayerEntity, SnapshotPacket } from '../shared/protocol.ts';
import { isGameEvent, isSnapshotPacket, parseServerPacket } from '../src/network/packet-guards.ts';
import { resolveServerUrl } from '../src/network/socket-session.ts';

const player: PlayerEntity = {
  id: 'p1', name: 'ANA', skin: 0, x: 1, y: 2, angle: 0, moving: false, status: 'alive',
  health: 100, maxHealth: 100, weapon: 'pistol', ammo: 12, magSize: 12, reserve: 12,
  owned: ['pistol'], ammoBag: { pistol: 12, carbine: 0, shotgun: 0 }, mags: { pistol: 12, carbine: 0, shotgun: 0 },
  medkits: 0, indoors: null,
  reload: 0, bleedout: 0, revive: 0, score: 0, kills: 0, lastInputSeq: 3,
};

const snapshot: SnapshotPacket = {
  type: 'snapshot',
  tick: 9,
  phase: 'wave',
  wave: 2,
  intermission: 0,
  hostiles: 1,
  players: [player],
  zombies: [{ id: 'z1', type: 'runner', x: 1, y: 1, angle: 0, health: 3, maxHealth: 3, attacking: false }],
  bullets: [{ id: 'b1', shooterId: 'p1', x: 0, y: 0, vx: 1, vy: 1 }],
  pickups: [{ id: 'k1', type: 'medkit', x: 0, y: 0 }],
  events: [{ type: 'wave_clear', wave: 1 }],
  gameOver: null,
};

const withField = (patch: object): unknown => ({ ...snapshot, ...patch });

describe('packet guards', () => {
  it('accepts a well-formed snapshot', () => {
    expect(isSnapshotPacket(snapshot)).toBe(true);
    expect(parseServerPacket(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('accepts a player indoors', () => {
    expect(isSnapshotPacket(withField({ players: [{ ...player, indoors: 'b3' }] }))).toBe(true);
  });

  it.each(['bandage', 'medkit', 'pistol_ammo', 'carbine_ammo', 'shells', 'carbine', 'shotgun'])('accepts a %s on the ground', (type) => {
    expect(isSnapshotPacket(withField({ pickups: [{ id: 'k', type, x: 0, y: 0 }] }))).toBe(true);
  });

  it.each([
    { type: 'melee', playerId: 'p1', x: 1, y: 1, angle: 0, hit: true },
    { type: 'heal', playerId: 'p1', x: 1, y: 1, amount: 50 },
    { type: 'zombie_alert', zombieId: 'z1', zombieType: 'walker', x: 1, y: 1 },
  ])('accepts a $type event', (event) => {
    expect(isGameEvent(event)).toBe(true);
  });

  it('accepts a game over block', () => {
    const gameOver = { wave: 3, durationSec: 90, players: [{ id: 'p1', name: 'ANA', skin: 0, kills: 4, score: 80 }] };
    expect(isSnapshotPacket(withField({ gameOver }))).toBe(true);
  });

  it.each([
    ['a missing tick', { tick: undefined }],
    ['a non-finite number', { hostiles: Number.NaN }],
    ['an unknown phase', { phase: 'lobby' }],
    ['entities that are not a list', { zombies: {} }],
    ['a player with a bad status', { players: [{ ...player, status: 'undead' }] }],
    ['a player with a bad weapon', { players: [{ ...player, weapon: 'bazooka' }] }],
    ['a player with no ammo bag', { players: [{ ...player, ammoBag: undefined }] }],
    ['an ammo bag missing a gun', { players: [{ ...player, ammoBag: { pistol: 1, carbine: 0 } }] }],
    ['a player with no magazine counts', { players: [{ ...player, mags: undefined }] }],
    ['magazine counts missing a gun', { players: [{ ...player, mags: { pistol: 1, carbine: 0 } }] }],
    ['a player with no medkit count', { players: [{ ...player, medkits: undefined }] }],
    ['a player with a bad building', { players: [{ ...player, indoors: 7 }] }],
    ['the old ammo pickup', { pickups: [{ id: 'k', type: 'ammo', x: 0, y: 0 }] }],
    ['a zombie of an unknown type', { zombies: [{ ...snapshot.zombies[0], type: 'ghoul' }] }],
    ['a malformed bullet', { bullets: [{ id: 'b' }] }],
    ['an unknown event', { events: [{ type: 'nope' }] }],
    ['a malformed game over', { gameOver: { wave: 1 } }],
  ])('rejects %s', (_name, patch) => {
    expect(isSnapshotPacket(withField(patch))).toBe(false);
  });

  it('rejects an event with a bad position', () => {
    expect(isGameEvent({ type: 'bullet_impact', x: 'near', y: 0, angle: 0 })).toBe(false);
  });

  it('parses welcome and disconnect packets', () => {
    const welcome = { type: 'welcome', yourId: 'a', tickRate: 30, mapSeed: 7 };
    expect(parseServerPacket(JSON.stringify(welcome))).toEqual(welcome);
    const left = { type: 'player_disconnected', playerId: 'a' };
    expect(parseServerPacket(JSON.stringify(left))).toEqual(left);
  });

  it.each([
    ['broken JSON', '{nope'],
    ['a bare value', '12'],
    ['null', 'null'],
    ['an unknown type', '{"type":"cheat"}'],
    ['a welcome without a seed', '{"type":"welcome","yourId":"a","tickRate":30}'],
  ])('returns null for %s', (_name, raw) => {
    expect(parseServerPacket(raw)).toBeNull();
  });

  it('returns null for a binary frame', () => {
    expect(parseServerPacket(new ArrayBuffer(4))).toBeNull();
  });
});

describe('resolveServerUrl', () => {
  const http = { hostname: 'game.local', protocol: 'http:' };
  const https = { hostname: 'game.local', protocol: 'https:' };

  it('defaults to this host and the server port', () => {
    expect(resolveServerUrl('', http)).toBe('ws://game.local:8097');
    expect(resolveServerUrl('   ', https)).toBe('wss://game.local:8097');
  });

  it('fills in the default port for a bare host', () => {
    expect(resolveServerUrl('10.0.0.5', http)).toBe('ws://10.0.0.5:8097');
  });

  it('keeps an explicit port', () => {
    expect(resolveServerUrl('10.0.0.5:9000', http)).toBe('ws://10.0.0.5:9000');
  });

  it('accepts ws and http urls as typed', () => {
    expect(resolveServerUrl('wss://play.example.org', http)).toBe('wss://play.example.org');
    expect(resolveServerUrl('http://10.0.0.5:9000', https)).toBe('ws://10.0.0.5:9000');
    expect(resolveServerUrl('https://play.example.org/room', http)).toBe('wss://play.example.org/room');
  });

  it('refuses what cannot be a server', () => {
    expect(resolveServerUrl('ftp://nope', http)).toBeNull();
    expect(resolveServerUrl('not a host', http)).toBeNull();
  });
});
