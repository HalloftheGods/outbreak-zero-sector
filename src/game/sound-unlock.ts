/**
 * What this browser has found for the Sound Test, kept next to the level progress but apart from it,
 * so old saves load untouched. The simulation never reads this: it only reports the find.
 */
import type { GameEvent } from '../../shared/protocol.ts';

const UNLOCK_KEY = 'outbreak.sound-unlock';

export interface SoundUnlock {
  /** True once a Radio has been found in this browser, by this player or a teammate. */
  readonly radio: boolean;
}

export const NO_SOUND_UNLOCK: SoundUnlock = { radio: false };

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSoundUnlock(store: Store | null = browserStore()): SoundUnlock {
  try {
    const raw = store?.getItem(UNLOCK_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    const isObject = typeof value === 'object' && value !== null;
    if (!isObject) return NO_SOUND_UNLOCK;
    return { radio: (value as Record<string, unknown>).radio === true };
  } catch {
    return NO_SOUND_UNLOCK;
  }
}

/** Notes a Radio found. It only ever unlocks. */
export function recordRadioFound(store: Store | null = browserStore()): SoundUnlock {
  const unlock = loadSoundUnlock(store);
  if (unlock.radio) return unlock;
  const next = { radio: true };
  try {
    store?.setItem(UNLOCK_KEY, JSON.stringify(next));
  } catch {
    // chemx-allow: best-effort unlock that does not persist is not worth interrupting a run for
  }
  return next;
}

/** Anyone's pickup of the Radio: the event reaches every connected client, so a whole party unlocks together. */
export function isRadioFound(event: GameEvent): boolean {
  return event.type === 'pickup' && event.pickup === 'radio';
}
