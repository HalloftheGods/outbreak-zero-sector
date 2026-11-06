import { afterEach, describe, expect, it, vi } from 'vitest';
import { JOIN_TOKEN_MAX_LENGTH } from '../shared/constants.ts';
import { SocketSession } from '../src/network/socket-session.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** A fresh copy of the module, the way a new page load gets one. */
async function loadToken(): Promise<() => string> {
  vi.resetModules();
  const { tabToken } = await import('../src/network/tab-token.ts');
  return tabToken;
}

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const kept = new Map<string, string>();
  return {
    getItem: (key) => kept.get(key) ?? null,
    setItem: (key, value) => void kept.set(key, value),
  };
}

const refusingStorage = (): Pick<Storage, 'getItem' | 'setItem'> => ({
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
});

describe('being turned away', () => {
  class ClosingSocket {
    static readonly OPEN = 1;
    static last: ClosingSocket;
    onclose: ((event: { code: number }) => void) | null = null;

    constructor() {
      ClosingSocket.last = this;
    }

    close(): void {}
  }

  it('says the server is busy, not that it cannot be reached', () => {
    vi.stubGlobal('WebSocket', ClosingSocket);
    const session = new SocketSession('ws://host:8097');
    const reasons: string[] = [];
    session.onClosed = (reason) => reasons.push(reason);
    session.connect({ name: 'ANA' });
    ClosingSocket.last.onclose?.({ code: 4001 });
    expect(reasons).toEqual(['That server is busy. Try again in a moment.']);
  });
});

describe('tab token', () => {
  it('survives a refresh of the tab', async () => {
    vi.stubGlobal('sessionStorage', fakeStorage());
    const first = (await loadToken())();
    const afterRefresh = (await loadToken())();
    expect(afterRefresh).toBe(first);
  });

  it('differs between two tabs', async () => {
    vi.stubGlobal('sessionStorage', fakeStorage());
    const first = (await loadToken())();
    vi.stubGlobal('sessionStorage', fakeStorage());
    const second = (await loadToken())();
    expect(second).not.toBe(first);
  });

  it('fits what the server accepts', async () => {
    vi.stubGlobal('sessionStorage', fakeStorage());
    const token = (await loadToken())();
    expect(token.length).toBeGreaterThan(0);
    expect(token.length).toBeLessThanOrEqual(JOIN_TOKEN_MAX_LENGTH);
  });

  it('replaces a stored value the server would refuse', async () => {
    const storage = fakeStorage();
    storage.setItem('outbreak.token', 'x'.repeat(JOIN_TOKEN_MAX_LENGTH + 1));
    vi.stubGlobal('sessionStorage', storage);
    const token = (await loadToken())();
    expect(token.length).toBeLessThanOrEqual(JOIN_TOKEN_MAX_LENGTH);
  });

  it('stays the same for the life of the page when storage is refused', async () => {
    vi.stubGlobal('sessionStorage', refusingStorage());
    const token = await loadToken();
    const first = token();
    expect(first.length).toBeGreaterThan(0);
    expect(token()).toBe(first);
  });

  it('works where sessionStorage does not exist at all', async () => {
    vi.stubGlobal('sessionStorage', undefined);
    const token = await loadToken();
    expect(token()).toBe(token());
  });
});
