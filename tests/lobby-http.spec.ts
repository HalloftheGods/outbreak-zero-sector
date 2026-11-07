import { describe, expect, it } from 'vitest';
import { LOBBY_BODY_MAX_BYTES, parseCreateRoom, parseMatchRequest } from '../shared/lobby/lobby-http.ts';
import { MAX_AVOID } from '../shared/lobby/types.ts';

const room = { protocol: 2, style: 'arcade', difficulty: 'stay_close', visibility: 'private', device: 'desktop' };
const match = { protocol: 2, style: 'campaign', difficulty: 'lights_out', character: 1 };

describe('parseCreateRoom', () => {
  it('accepts a good body and keeps a private label', () => {
    expect(parseCreateRoom(room)).toEqual(room);
    expect(parseCreateRoom({ ...room, label: '  Xo  ' })).toEqual({ ...room, label: 'Xo' });
  });

  it('drops the label on a public room, and a label the filter refuses', () => {
    expect(parseCreateRoom({ ...room, visibility: 'public', label: 'Xo' })).toEqual({ ...room, visibility: 'public' });
    expect(parseCreateRoom({ ...room, label: '\u0000\u0001' })).toEqual(room);
  });

  it('refuses bad shapes', () => {
    for (const bad of [
      null,
      [],
      'x',
      { ...room, protocol: 0 },
      { ...room, protocol: 1.5 },
      { ...room, style: 'deathmatch' },
      { ...room, difficulty: 'easy' },
      { ...room, visibility: 'friends' },
      { ...room, device: 'tablet' },
      { ...room, label: 7 },
    ]) {
      expect(parseCreateRoom(bad)).toBeNull();
    }
  });

  it('caps bodies at 4 KB', () => {
    expect(LOBBY_BODY_MAX_BYTES).toBe(4096);
  });
});

describe('parseMatchRequest', () => {
  it('accepts a good body and its optional fields', () => {
    expect(parseMatchRequest(match)).toEqual(match);
    expect(parseMatchRequest({ ...match, highest: 4, device: 'phone', avoid: ['bcdfg'] })).toEqual({
      ...match,
      highest: 4,
      device: 'phone',
      avoid: ['BCDFG'],
    });
  });

  it('drops avoid entries that are not room codes, and the list when none are left', () => {
    expect(parseMatchRequest({ ...match, avoid: ['BCDFG', 'nope', 3] })).toEqual({ ...match, avoid: ['BCDFG'] });
    expect(parseMatchRequest({ ...match, avoid: ['nope'] })).toEqual(match);
  });

  it('refuses bad shapes', () => {
    for (const bad of [
      null,
      { ...match, character: -1 },
      { ...match, character: 99 },
      { ...match, highest: 0 },
      { ...match, device: 'fridge' },
      { ...match, avoid: 'BCDFG' },
      { ...match, avoid: Array(MAX_AVOID + 1).fill('BCDFG') },
      { ...match, protocol: '2' },
    ]) {
      expect(parseMatchRequest(bad)).toBeNull();
    }
  });
});
