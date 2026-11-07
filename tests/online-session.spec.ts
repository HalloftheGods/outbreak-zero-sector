import { describe, expect, it } from 'vitest';
import { loopbackPair } from '../src/network/packet-pipe.ts';
import { onlineRoomsLive, socketUrl } from '../src/network/play-api.ts';
import { RemoteSession } from '../src/network/remote-session.ts';
import { reportOf } from '../src/network/host-session.ts';
import type { SnapshotPacket } from '../shared/protocol.ts';

const words = { badAddress: 'bad', noAnswer: 'none', unreachable: 'gone' };
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('loopback pipe', () => {
  it('carries text both ways after a microtask, and closing the host side tells the client', async () => {
    const { pipe, peer } = loopbackPair();
    const heard: string[] = [];
    const closes: number[] = [];
    pipe.open({ message: (text) => heard.push(text), closed: (code) => closes.push(code) });
    const frames: string[] = [];
    peer.onFrame = (text) => frames.push(text);
    peer.send('to client');
    pipe.send('to host');
    expect(heard).toEqual([]);
    await flush();
    expect(heard).toEqual(['to client']);
    expect(frames).toEqual(['to host']);
    peer.close(4011, 'host left');
    await flush();
    expect(closes).toEqual([4011]);
    expect(peer.open).toBe(false);
  });

  it('answers a probe while open, so the host never drops its own player', () => {
    const { peer } = loopbackPair();
    let heard = 0;
    peer.onProbe = () => (heard += 1);
    peer.probe();
    peer.close(1000, '');
    peer.probe();
    expect(heard).toBe(1);
  });

  it('runs a RemoteSession: room, then a bye from the host ends it with the close text', async () => {
    const { pipe, peer } = loopbackPair();
    const session = new RemoteSession(pipe, words);
    const rooms: unknown[] = [];
    const ended: string[] = [];
    session.onRoom = (style) => rooms.push(style);
    session.onClosed = (reason) => ended.push(reason);
    session.connect({ name: '' });
    peer.send(JSON.stringify({ type: 'room', style: 'arcade' }));
    await flush();
    expect(rooms).toEqual(['arcade']);
    peer.send(JSON.stringify({ type: 'bye', code: 4011, reason: 'host left' }));
    await flush();
    expect(ended).toEqual(['Your friend left, so the game ended.']);
  });
});

describe('play-api client', () => {
  it('is off without an API, and turns https into wss', () => {
    expect(onlineRoomsLive('')).toBe(false);
    expect(onlineRoomsLive('https://play-api.forthexp.com')).toBe(true);
    expect(socketUrl('https://play-api.forthexp.com', '/v1/rooms/BCDFG/guest?protocol=2')).toBe('wss://play-api.forthexp.com/v1/rooms/BCDFG/guest?protocol=2');
    expect(socketUrl('http://localhost:8787', '/v1/rooms/BCDFG/host')).toBe('ws://localhost:8787/v1/rooms/BCDFG/host');
  });
});

describe('room report', () => {
  it('counts seats and marks each taken survivor', () => {
    const snapshot = { level: 3, players: [{ skin: 0 }, { skin: 2 }] } as unknown as SnapshotPacket;
    expect(reportOf(snapshot)).toEqual({ seats: 2, taken: 0b101, level: 3, highest: 3, phase: 'playing', locked: false });
    expect(reportOf({ ...snapshot, phase: 'gameover' } as SnapshotPacket).phase).toBe('over');
  });
});
