/** How far the player has got, kept apart from the best run so old saves load untouched. */
import { FINAL_LEVEL, FIRST_LEVEL } from '../../shared/levels.ts';

const PROGRESS_KEY = 'outbreak.level-progress';

export interface LevelProgress {
  /** Highest level a run has started. Level 1 always counts. */
  readonly highest: number;
  /** True once a run has finished the last level. */
  readonly finished: boolean;
}

export const NO_PROGRESS: LevelProgress = { highest: FIRST_LEVEL, finished: false };

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadLevelProgress(store: Store | null = browserStore()): LevelProgress {
  try {
    const raw = store?.getItem(PROGRESS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    const isObject = typeof value === 'object' && value !== null;
    if (!isObject) return NO_PROGRESS;
    const saved = value as Record<string, unknown>;
    const level = Number(saved.highest);
    const highest = Number.isFinite(level) ? Math.min(FINAL_LEVEL, Math.max(FIRST_LEVEL, Math.floor(level))) : FIRST_LEVEL;
    return { highest, finished: saved.finished === true };
  } catch {
    return NO_PROGRESS;
  }
}

function save(progress: LevelProgress, store: Store | null): void {
  try {
    store?.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // chemx-allow: best-effort progress that does not persist is not worth interrupting a run for
  }
}

/** Notes a level starting. Only ever moves the highest level up. */
export function recordLevelReached(level: number, store: Store | null = browserStore()): LevelProgress {
  const progress = loadLevelProgress(store);
  const reached = Math.min(FINAL_LEVEL, Math.floor(level));
  const isAdvance = Number.isFinite(reached) && reached > progress.highest;
  if (!isAdvance) return progress;
  const next = { ...progress, highest: reached };
  save(next, store);
  return next;
}

/** Notes the last level cleared, which also means every level was reached. */
export function recordGameFinished(store: Store | null = browserStore()): LevelProgress {
  const progress = loadLevelProgress(store);
  const alreadyFinished = progress.finished && progress.highest === FINAL_LEVEL;
  if (alreadyFinished) return progress;
  const next = { highest: FINAL_LEVEL, finished: true };
  save(next, store);
  return next;
}

/** The level a continued run starts at, or null while the furthest reached is still the first (nothing to continue). */
export function continueLevel(progress: LevelProgress): number | null {
  return progress.highest > FIRST_LEVEL ? progress.highest : null;
}

export const isLevelUnlocked = (level: number, progress: LevelProgress): boolean => level <= progress.highest;
