// What a trip's end leaves behind on this machine: the best trip, and the ending's screen.

import type { TripReceipt } from '../../shared/home-protocol.ts';
import type { GameOverStats } from '../../shared/protocol.ts';
import type { RunResult } from './hud-state.ts';
import { recordLeaderboardEntry, recordRun } from './storage.ts';
import type { BestRun, LeaderboardEntry } from './storage.ts';

const FALLBACK_CALLSIGN = 'SURVIVOR';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Marks a record as one trip, so the Records page can tell it from a whole run played before the bunker. */
interface TripMarked {
  readonly trip: true;
}

function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * `recordRun` writes the best run and a leaderboard entry together and marks neither as a trip.
 * This lets the best run through, marked, and drops the leaderboard write, which is made marked below.
 */
function bestRunOnly(store: Store): Store {
  const isLeaderboard = (json: string): boolean => json.startsWith('[');
  return {
    getItem: (key) => store.getItem(key),
    setItem: (key, value) => {
      if (!isLeaderboard(value)) store.setItem(key, value);
    },
  };
}

/**
 * Records a trip from its receipt, banked or not, and reports whether it is the new best.
 * Score, kills and hordes count per trip, so this is the trip's own best, not a run's.
 */
export function recordTrip(receipt: TripReceipt, callsign: string): boolean {
  const store = browserStore();
  if (!store) return false;
  const { score, kills, hordes, seconds } = receipt;
  const run: BestRun & TripMarked = { score, kills, wave: hordes, durationSec: seconds, trip: true };
  const qualifies = score > 0 || hordes > 0;
  if (qualifies) {
    const entry: LeaderboardEntry & TripMarked = { ...run, callsign: callsign.trim() || FALLBACK_CALLSIGN, timestamp: Date.now() };
    recordLeaderboardEntry(entry, store);
  }
  return recordRun(run, bestRunOnly(store), callsign);
}

export interface Survivor {
  readonly id: string;
  readonly name: string;
  readonly skin: number;
}

/** The ending's tally, worded from the receipt that carried it. */
export function endingResult(receipt: TripReceipt, survivor: Survivor, isNewBest: boolean): RunResult {
  const { score, kills, hordes, seconds, difficulty, level } = receipt;
  const stats: GameOverStats = {
    outcome: 'victory',
    difficulty,
    level,
    wave: hordes,
    durationSec: seconds,
    players: [{ ...survivor, kills, score }],
  };
  return { stats, localId: survivor.id, score, kills, isNewBest };
}
