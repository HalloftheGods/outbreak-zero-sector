/** How far the player has got, kept apart from the best run so old saves load untouched. */
import { FINAL_LEVEL, FIRST_LEVEL, LEVELS } from '../../shared/levels.ts';

const PROGRESS_KEY = 'outbreak.level-progress';
/** Campaign's reach is its own: trips open levels for the garage map, never for Arcade's Levels page. */
const CAMPAIGN_PROGRESS_KEY = 'outbreak.campaign-progress';

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

export function loadLevelProgress(store: Store | null = browserStore(), key: string = PROGRESS_KEY): LevelProgress {
  try {
    const raw = store?.getItem(key);
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

export const loadCampaignProgress = (store: Store | null = browserStore()): LevelProgress => loadLevelProgress(store, CAMPAIGN_PROGRESS_KEY);

/** How far this player has got in either style. Only for what is heard, since a track heard in one style has been heard. */
export function loadFurthestProgress(store: Store | null = browserStore()): LevelProgress {
  const arcade = loadLevelProgress(store);
  const campaign = loadCampaignProgress(store);
  return { highest: Math.max(arcade.highest, campaign.highest), finished: arcade.finished || campaign.finished };
}

function save(progress: LevelProgress, store: Store | null, key: string): void {
  try {
    store?.setItem(key, JSON.stringify(progress));
  } catch {
    // chemx-allow: best-effort progress that does not persist is not worth interrupting a run for
  }
}

/** Notes a level starting. Only ever moves the highest level up. */
export function recordLevelReached(level: number, store: Store | null = browserStore(), key: string = PROGRESS_KEY): LevelProgress {
  const progress = loadLevelProgress(store, key);
  const reached = Math.min(FINAL_LEVEL, Math.floor(level));
  const isAdvance = Number.isFinite(reached) && reached > progress.highest;
  if (!isAdvance) return progress;
  const next = { ...progress, highest: reached };
  save(next, store, key);
  return next;
}

/** Notes a banked trip: reaching the van on level n opens level n+1. Campaign's only way up, so a carried player does not unlock on arrival. */
export function recordLevelCleared(level: number, store: Store | null = browserStore()): LevelProgress {
  return recordLevelReached(level + 1, store, CAMPAIGN_PROGRESS_KEY);
}

/** Notes the last level cleared, which also means every level was reached. */
export function recordGameFinished(store: Store | null = browserStore(), key: string = PROGRESS_KEY): LevelProgress {
  const progress = loadLevelProgress(store, key);
  const alreadyFinished = progress.finished && progress.highest === FINAL_LEVEL;
  if (alreadyFinished) return progress;
  const next = { highest: FINAL_LEVEL, finished: true };
  save(next, store, key);
  return next;
}

export const recordCampaignFinished = (store: Store | null = browserStore()): LevelProgress => recordGameFinished(store, CAMPAIGN_PROGRESS_KEY);

/** The level a continued run starts at, or null while the furthest reached is still the first (nothing to continue). */
export function continueLevel(progress: LevelProgress): number | null {
  return progress.highest > FIRST_LEVEL ? progress.highest : null;
}

export const isLevelUnlocked = (level: number, progress: LevelProgress): boolean => level <= progress.highest;

/** The level a run should start at, or null when it is a normal new run: level 1, unknown, or not unlocked (a stale or edited value cannot skip ahead). */
export function chosenStartLevel(level: number, progress: LevelProgress): number | null {
  const isWhole = Number.isInteger(level);
  const isLater = level > FIRST_LEVEL;
  const isAllowed = isWhole && isLater && isLevelUnlocked(level, progress);
  return isAllowed && LEVELS.some((entry) => entry.number === level) ? level : null;
}

/** A chosen level when there is one, otherwise the furthest reached (null while that is still the first). */
export function soloStartLevel(chosen: number | undefined, progress: LevelProgress): number | null {
  return chosen === undefined ? continueLevel(progress) : chosenStartLevel(chosen, progress);
}
