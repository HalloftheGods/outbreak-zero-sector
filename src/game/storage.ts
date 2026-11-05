const BEST_KEY = 'outbreak.best';
const PREFS_KEY = 'outbreak.prefs';

export interface BestRun {
  readonly score: number;
  /** Hordes survived to the end. Runs saved by older builds counted the horde that killed them too. */
  readonly wave: number;
  readonly kills: number;
  readonly durationSec: number;
}

/** Volume and mute live with the audio engine, which persists its own. */
export interface Prefs {
  readonly callsign: string;
  readonly serverAddress: string;
}

export const DEFAULT_PREFS: Prefs = { callsign: '', serverAddress: '' };

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** localStorage can throw on access alone in a private window or a locked-down frame. */
function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readJson(store: Store | null, key: string): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(store: Store | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // A best run that does not persist is not worth interrupting a game over for.
  }
}

function isBestRun(v: unknown): v is BestRun {
  if (typeof v !== 'object' || v === null) return false;
  const run = v as Record<string, unknown>;
  return ['score', 'wave', 'kills', 'durationSec'].every((key) => Number.isFinite(run[key]));
}

export function loadBest(store: Store | null = browserStore()): BestRun | null {
  const value = readJson(store, BEST_KEY);
  return isBestRun(value) ? value : null;
}

export function beatsBest(run: BestRun, best: BestRun | null): boolean {
  if (!best) return run.score > 0 || run.wave > 0;
  return run.score > best.score || (run.score === best.score && run.wave > best.wave);
}

/** Stores the run if it is a new best, and reports whether it was. */
export function recordRun(run: BestRun, store: Store | null = browserStore()): boolean {
  if (!beatsBest(run, loadBest(store))) return false;
  writeJson(store, BEST_KEY, run);
  return true;
}

export function loadPrefs(store: Store | null = browserStore()): Prefs {
  const value = readJson(store, PREFS_KEY);
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFS;
  const saved = value as Partial<Record<keyof Prefs, unknown>>;
  return {
    callsign: typeof saved.callsign === 'string' ? saved.callsign : DEFAULT_PREFS.callsign,
    serverAddress: typeof saved.serverAddress === 'string' ? saved.serverAddress : DEFAULT_PREFS.serverAddress,
  };
}

export function savePrefs(prefs: Prefs, store: Store | null = browserStore()): void {
  writeJson(store, PREFS_KEY, prefs);
}
