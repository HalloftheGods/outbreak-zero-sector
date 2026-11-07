import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../shared/characters.ts';
import {
  parseGuestSignal,
  parseHostSignal,
  parseIceServers,
  parseToGuestSignal,
  parseToHostSignal,
  SIGNAL_MAX_BYTES,
} from '../shared/lobby/lobby-protocol.ts';

const json = (value: unknown): string => JSON.stringify(value);
const ice = { candidate: 'candidate:1 1 udp 2122 10.0.0.1 5000 typ host', sdpMid: '0', sdpMLineIndex: 0 };

describe('host signals', () => {
  it('accepts each message', () => {
    expect(parseHostSignal(json({ type: 'auth', hostKey: 'k' }))).toEqual({ type: 'auth', hostKey: 'k' });
    expect(parseHostSignal(json({ type: 'answer', peerId: 'p1', sdp: 'v=0' }))).toEqual({ type: 'answer', peerId: 'p1', sdp: 'v=0' });
    expect(parseHostSignal(json({ type: 'ice', peerId: 'p1', ice }))).toMatchObject({ type: 'ice', peerId: 'p1' });
    expect(parseHostSignal(json({ type: 'end' }))).toEqual({ type: 'end' });
    expect(parseHostSignal(json({ type: 'end', reason: 'quit' }))).toEqual({ type: 'end', reason: 'quit' });
    const report = { seats: 2, taken: 3, level: 1, highest: 2, phase: 'playing', locked: false };
    expect(parseHostSignal(json({ type: 'report', report }))).toEqual({ type: 'report', report });
  });

  it('rejects bad shapes', () => {
    const bad = [
      '', 'nope', '[]', '5', json({}), json({ type: 'wat' }), json({ type: 'auth' }), json({ type: 'auth', hostKey: '' }),
      json({ type: 'answer', peerId: 'p1' }), json({ type: 'ice', peerId: 'p1', ice: { candidate: 5 } }),
      json({ type: 'ice', peerId: 'p1', ice: { candidate: 'x', sdpMLineIndex: -1 } }),
      json({ type: 'report', report: { seats: 9, taken: 0, level: 1, highest: 1, phase: 'playing', locked: false } }),
      json({ type: 'report', report: { seats: 1, taken: 0, level: 1, highest: 1, phase: 'dancing', locked: false } }),
      json({ type: 'end', reason: 5 }),
    ];
    for (const text of bad) expect(parseHostSignal(text)).toBeNull();
    expect(parseHostSignal(undefined)).toBeNull();
    expect(parseHostSignal(5)).toBeNull();
  });

  it('takes a survivor bitmask up to every survivor and refuses a bit past the last', () => {
    const reportWith = (taken: number) => parseHostSignal(json({ type: 'report', report: { seats: 4, taken, level: 1, highest: 1, phase: 'muster', locked: false } }));
    const everyone = (1 << CHARACTERS.length) - 1;
    expect(everyone).toBe(31);
    for (const taken of [0, 15, 16, everyone]) expect(reportWith(taken), String(taken)).toMatchObject({ type: 'report' });
    for (const taken of [everyone + 1, 63, -1, 1.5]) expect(reportWith(taken), String(taken)).toBeNull();
  });

  it('refuses text over 16 KB, counted in bytes', () => {
    const big = json({ type: 'answer', peerId: 'p', sdp: 'x'.repeat(SIGNAL_MAX_BYTES) });
    expect(parseHostSignal(big)).toBeNull();
    const wide = json({ type: 'auth', hostKey: 'é'.repeat(SIGNAL_MAX_BYTES / 2) });
    expect(parseHostSignal(wide)).toBeNull();
  });
});

describe('guest signals', () => {
  it('accepts an offer and ice, rejects the rest', () => {
    expect(parseGuestSignal(json({ type: 'offer', sdp: 'v=0' }))).toEqual({ type: 'offer', sdp: 'v=0' });
    expect(parseGuestSignal(json({ type: 'ice', ice }))).toMatchObject({ type: 'ice' });
    expect(parseGuestSignal(json({ type: 'auth', hostKey: 'k' }))).toBeNull();
    expect(parseGuestSignal(json({ type: 'offer', sdp: 'x'.repeat(13 * 1024) }))).toBeNull();
    expect(parseGuestSignal('{')).toBeNull();
  });
});

describe('relayed signals', () => {
  it('tags the host side by peer and leaves the guest side untagged', () => {
    expect(parseToHostSignal(json({ type: 'offer', peerId: 'p1', sdp: 'v=0' }))).toEqual({ type: 'offer', peerId: 'p1', sdp: 'v=0' });
    expect(parseToHostSignal(json({ type: 'peer-left', peerId: 'p1' }))).toEqual({ type: 'peer-left', peerId: 'p1' });
    expect(parseToHostSignal(json({ type: 'ice', peerId: 'p1', ice }))).toMatchObject({ type: 'ice' });
    expect(parseToHostSignal(json({ type: 'offer', sdp: 'v=0' }))).toBeNull();
    expect(parseToGuestSignal(json({ type: 'answer', sdp: 'v=0' }))).toEqual({ type: 'answer', sdp: 'v=0' });
    expect(parseToGuestSignal(json({ type: 'peer-left' }))).toEqual({ type: 'peer-left' });
    expect(parseToGuestSignal(json({ type: 'ice', ice }))).toMatchObject({ type: 'ice' });
    expect(parseToGuestSignal(json({ type: 'offer', sdp: 'v=0' }))).toBeNull();
  });
});

describe('ICE servers on ready and admitted', () => {
  const stun = { urls: 'stun:stun.cloudflare.com:3478' };
  const turn = { urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' };

  it('reads ready on the host side and admitted on the guest side', () => {
    expect(parseToHostSignal(json({ type: 'ready', iceServers: [stun, turn], relayOnly: true }))).toEqual({
      type: 'ready',
      iceServers: [stun, turn],
      relayOnly: true,
    });
    expect(parseToGuestSignal(json({ type: 'admitted', peerId: 'p1', iceServers: [stun], relayOnly: false }))).toEqual({
      type: 'admitted',
      peerId: 'p1',
      iceServers: [stun],
      relayOnly: false,
    });
  });

  it('refuses an empty or malformed server list', () => {
    expect(parseToHostSignal(json({ type: 'ready', iceServers: [], relayOnly: true }))).toBeNull();
    expect(parseToHostSignal(json({ type: 'ready', iceServers: [{ urls: [] }], relayOnly: true }))).toBeNull();
    expect(parseToHostSignal(json({ type: 'ready', iceServers: [stun] }))).toBeNull();
    expect(parseToGuestSignal(json({ type: 'admitted', iceServers: [stun], relayOnly: false }))).toBeNull();
    expect(parseIceServers([{ urls: 'stun:x', username: 5 }])).toBeNull();
  });
});
