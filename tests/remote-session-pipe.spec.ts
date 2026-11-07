import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOSE, closeText } from '../shared/close-codes.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { PacketPipe } from '../src/network/packet-pipe.ts';
import { RemoteSession } from '../src/network/remote-session.ts';

/** A link held in memory, the way a data channel would be: up at once, no close code of its own. */
class MemoryPipe implements PacketPipe {
  readonly label = 'a friend';
  onText: (text: string) => void = () => {};
  onClose: (code: number, reason: string) => void = () => {};
  sent: string[] = [];
  closed = false;
  open: (() => void) | undefined;

  send(text: string): void {
    this.sent.push(text);
  }

  close(): void {
    this.closed = true;
  }
}

const welcome = JSON.stringify({ type: 'welcome', yourId: 'a', tickRate: 30, mapSeed: 7 });

function connect() {
  const pipe = new MemoryPipe();
  const session = new RemoteSession(pipe);
  const closed: string[] = [];
  session.onClosed = (reason) => closed.push(reason);
  session.onRoom = (style) => session.join(style ?? 'arcade');
  session.connect({ name: 'ANA' });
  return { pipe, session, closed };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RemoteSession over an in-memory pipe', () => {
  it('joins once the room speaks, over the pipe it was given', () => {
    const { pipe } = connect();
    expect(pipe.sent).toHaveLength(0);
    pipe.onText(JSON.stringify({ type: 'room', style: 'arcade' }));
    expect(JSON.parse(pipe.sent[0])).toMatchObject({ type: 'join', name: 'ANA', style: 'arcade', protocol: PROTOCOL_VERSION });
  });

  it('maps a bye packet to its close code and ignores the close that follows', () => {
    const { pipe, closed } = connect();
    pipe.onText(JSON.stringify({ type: 'bye', code: CLOSE.removed, reason: 'removed' }));
    expect(closed).toEqual([closeText(CLOSE.removed)]);
    expect(pipe.closed).toBe(true);
    pipe.onClose(1006, '');
    expect(closed).toHaveLength(1);
  });

  it('names the far end when nothing answers', () => {
    const { closed } = connect();
    vi.advanceTimersByTime(7000);
    expect(closed[0]).toContain('a friend');
  });

  it('finishes with a bad address when the pipe cannot open', () => {
    const pipe = new MemoryPipe();
    pipe.open = () => {
      throw new Error('no');
    };
    const session = new RemoteSession(pipe);
    const closed: string[] = [];
    session.onClosed = (reason) => closed.push(reason);
    session.connect({ name: 'ANA' });
    expect(closed[0]).toMatch(/bad server address/i);
  });

  it('reports a dropped link once welcomed', () => {
    const { pipe, closed } = connect();
    pipe.onText(welcome);
    pipe.onClose(1006, '');
    expect(closed).toEqual(['The connection to the server dropped.']);
  });
});
