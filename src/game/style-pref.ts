import { DEFAULT_STYLE, isGameStyle } from '../../shared/game-style.ts';
import type { GameStyle } from '../../shared/game-style.ts';

const STYLE_KEY = 'outbreak.style';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The style the player last chose, or the default when nothing valid is saved. */
export function loadStyle(store: Store | null = browserStore()): GameStyle {
  try {
    const saved = store?.getItem(STYLE_KEY);
    return isGameStyle(saved) ? saved : DEFAULT_STYLE;
  } catch {
    return DEFAULT_STYLE;
  }
}

export function saveStyle(style: GameStyle, store: Store | null = browserStore()): void {
  try {
    store?.setItem(STYLE_KEY, style);
  } catch {
    // chemx-allow: best-effort a choice that does not persist is not worth interrupting the menu for
  }
}
