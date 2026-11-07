import { describe, expect, it } from 'vitest';
import {
  buildInviteLink,
  buildRoomLink,
  parseInvite,
  parseJoinParam,
  parseRoomParam,
  sanitizeJoinAddress,
  withoutJoinParam,
} from '../src/game/invite-link.ts';

describe('sanitizeJoinAddress', () => {
  it('accepts host, host:port and ws/wss urls', () => {
    expect(sanitizeJoinAddress('10.0.0.5')).toBe('10.0.0.5');
    expect(sanitizeJoinAddress('10.0.0.5:9000')).toBe('10.0.0.5:9000');
    expect(sanitizeJoinAddress('Play.Example.org:8080')).toBe('play.example.org:8080');
    expect(sanitizeJoinAddress('wss://play.example.org')).toBe('wss://play.example.org');
    expect(sanitizeJoinAddress('WS://game.local:9000')).toBe('ws://game.local:9000');
    expect(sanitizeJoinAddress('  game.local:9000  ')).toBe('game.local:9000');
  });

  it('refuses other schemes, paths, credentials and junk', () => {
    for (const bad of [
      'javascript:alert(1)',
      'http://10.0.0.5:9000',
      'ftp://nope',
      'ws://host/path',
      'host:9000/room',
      'host?x=1',
      'user:pass@host',
      'user@host',
      'not a host',
      '<script>',
      'host:0',
      'host:65536',
      'host:abc',
      '-bad.example',
      'a..b',
      '',
      '   ',
    ]) {
      expect(sanitizeJoinAddress(bad), bad).toBeNull();
    }
  });

  it('refuses missing values and absurd lengths', () => {
    expect(sanitizeJoinAddress(null)).toBeNull();
    expect(sanitizeJoinAddress(undefined)).toBeNull();
    expect(sanitizeJoinAddress(`${'a'.repeat(300)}.com`)).toBeNull();
  });
});

describe('parseJoinParam', () => {
  it('reads and decodes ?join=', () => {
    expect(parseJoinParam('?join=10.0.0.5:9000')).toBe('10.0.0.5:9000');
    expect(parseJoinParam('?x=1&join=wss%3A%2F%2Fplay.example.org')).toBe('wss://play.example.org');
  });

  it('returns null when absent, empty or unsafe', () => {
    expect(parseJoinParam('')).toBeNull();
    expect(parseJoinParam('?join=')).toBeNull();
    expect(parseJoinParam('?other=1')).toBeNull();
    expect(parseJoinParam('?join=javascript:alert(1)')).toBeNull();
    expect(parseJoinParam('?join=http%3A%2F%2Fevil.example')).toBeNull();
  });
});

describe('buildInviteLink', () => {
  it('adds ?join= to the page url and drops other params and the hash', () => {
    expect(buildInviteLink('https://game.example/zombie/?old=1#top', '10.0.0.5:9000')).toBe(
      'https://game.example/zombie/?join=10.0.0.5%3A9000',
    );
  });

  it('round-trips through parseJoinParam', () => {
    for (const address of ['10.0.0.5', '10.0.0.5:9000', 'wss://play.example.org', 'ws://game.local:9000']) {
      const link = buildInviteLink('http://localhost:5173/', address)!;
      expect(parseJoinParam(new URL(link).search)).toBe(address);
    }
  });

  it('returns null for an unusable address or page', () => {
    expect(buildInviteLink('http://localhost/', 'javascript:alert(1)')).toBeNull();
    expect(buildInviteLink('http://localhost/', '')).toBeNull();
    expect(buildInviteLink('not a url', '10.0.0.5')).toBeNull();
  });
});

describe('withoutJoinParam', () => {
  it('removes only the join param', () => {
    expect(withoutJoinParam('http://localhost/?join=10.0.0.5&x=1')).toBe('http://localhost/?x=1');
    expect(withoutJoinParam('http://localhost/?join=10.0.0.5')).toBe('http://localhost/');
  });
});

describe('?room= invites', () => {
  it('reads a valid code and refuses junk', () => {
    expect(parseRoomParam('?room=bcdfg')).toBe('BCDFG');
    expect(parseRoomParam('?room=BCDF1')).toBeNull();
    expect(parseRoomParam('?room=')).toBeNull();
    expect(parseRoomParam('?join=BCDFG')).toBeNull();
  });

  it('prefers ?room over ?join, and keeps ?join as the LAN invite', () => {
    expect(parseInvite('?join=10.0.0.5:9000&room=BCDFG')).toEqual({ kind: 'room', code: 'BCDFG' });
    expect(parseInvite('?join=10.0.0.5:9000')).toEqual({ kind: 'join', address: '10.0.0.5:9000' });
    expect(parseInvite('?room=bad1&join=10.0.0.5')).toEqual({ kind: 'join', address: '10.0.0.5' });
    expect(parseInvite('?x=1')).toBeNull();
  });

  it('builds and round-trips a room link, and strips both params', () => {
    const link = buildRoomLink('https://game.example/zombie/?old=1#top', 'bcdfg')!;
    expect(link).toBe('https://game.example/zombie/?room=BCDFG');
    expect(parseRoomParam(new URL(link).search)).toBe('BCDFG');
    expect(buildRoomLink('https://game.example/', 'nope1')).toBeNull();
    expect(withoutJoinParam('https://game.example/?room=BCDFG&join=h&x=1')).toBe('https://game.example/?x=1');
  });
});
