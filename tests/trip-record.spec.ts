import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripReceipt } from '../shared/home-protocol.ts';
import { loadBest, loadLeaderboard } from '../src/game/storage.ts';
import { loadBestTrip, recordTrip } from '../src/game/trip-record.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const receipt = (patch: Partial<TripReceipt>): TripReceipt =>
  ({ outcome: 'banked', score: 0, kills: 0, hordes: 0, seconds: 60, level: 1, difficulty: 'normal', ending: false, ...patch }) as TripReceipt;

describe('the best trip', () => {
  const classic = { score: 5000, wave: 9, kills: 400, durationSec: 1800 };

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage({ 'outbreak.best': JSON.stringify(classic) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is not compared with a whole run played before the bunker', () => {
    const isNewBest = recordTrip(receipt({ score: 300, kills: 12, hordes: 2 }), 'A');
    expect(isNewBest).toBe(true);
    expect(loadBestTrip()).toMatchObject({ score: 300, kills: 12, trip: true });
  });

  it('leaves the old best run as it was', () => {
    recordTrip(receipt({ score: 300, hordes: 2 }), 'A');
    expect(loadBest()).toEqual(classic);
  });

  it('is beaten only by a better trip', () => {
    recordTrip(receipt({ score: 300, hordes: 2 }), 'A');
    expect(recordTrip(receipt({ score: 200, hordes: 2 }), 'A')).toBe(false);
    expect(recordTrip(receipt({ score: 400, hordes: 2 }), 'A')).toBe(true);
    expect(loadBestTrip()?.score).toBe(400);
  });

  it('still lists the trip on the leaderboard, marked', () => {
    recordTrip(receipt({ score: 300, hordes: 2 }), 'A');
    expect(loadLeaderboard().find((entry) => 'trip' in entry)).toMatchObject({ score: 300, trip: true });
  });
});
