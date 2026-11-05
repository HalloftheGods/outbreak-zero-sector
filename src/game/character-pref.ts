import { isCharacterIndex } from '../../shared/characters.ts';

const CHARACTER_KEY = 'outbreak.character';
const FIRST_CHARACTER = 0;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The survivor the player last chose, or the first one when nothing valid is saved. */
export function loadCharacter(store: Store | null = browserStore()): number {
  try {
    const saved = Number(store?.getItem(CHARACTER_KEY) ?? FIRST_CHARACTER);
    return isCharacterIndex(saved) ? saved : FIRST_CHARACTER;
  } catch {
    return FIRST_CHARACTER;
  }
}

export function saveCharacter(character: number, store: Store | null = browserStore()): void {
  try {
    store?.setItem(CHARACTER_KEY, String(character));
  } catch {
    // chemx-allow: best-effort a choice that does not persist is not worth interrupting the menu for
  }
}
