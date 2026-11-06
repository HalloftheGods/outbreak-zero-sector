/** The words the setup page shows for a level picked on the Levels page. The decisions live in level-progress.ts. */
import { LEVELS } from '../../shared/levels.ts';

export const COOP_LEVEL_NOTE = 'Co-op always starts on level 1. Your chosen level applies to solo only.';

/** The setup page's line for a chosen level, or null for none or an unknown level. */
export function startAtLabel(level: number | null): string | null {
  const found = level === null ? undefined : LEVELS.find((entry) => entry.number === level);
  return found ? `Start at level ${found.number}: ${found.title}` : null;
}
