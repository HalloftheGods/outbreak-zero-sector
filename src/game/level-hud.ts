import { BUNKER_LEVEL } from '../../shared/home-protocol.ts';
import { FINAL_LEVEL, levelDef } from '../../shared/levels.ts';
import { townRule } from '../../shared/town-rules.ts';
import type { HudState, LevelCard } from './hud-state.ts';

/** Hordes this town has seen off, the one on the street not counted. */
function hordesSurvived(hud: Pick<HudState, 'phase' | 'wave'>): number {
  return hud.phase === 'wave' ? hud.wave - 1 : hud.wave;
}

/** Which level this is, for the HUD. */
export function levelLine(level: number): string {
  const home = level === BUNKER_LEVEL;
  if (home) return 'Home';
  const { number, title } = levelDef(level);
  return `Level ${number}: ${title}`;
}

/** What stands between the players and the next town. */
export function levelGoal(hud: Pick<HudState, 'level' | 'phase' | 'wave' | 'exitOpen'>): string {
  const home = hud.level === BUNKER_LEVEL;
  if (home) return 'Gear up, then take the van';
  if (hud.exitOpen) return 'Get to the van';
  return `${hordesSurvived(hud)} of ${levelDef(hud.level).hordes} hordes survived`;
}

/** The words for a level's title card. */
export function levelTitle(level: number): Omit<LevelCard, 'key'> {
  const { number, title, hordes } = levelDef(level);
  const isLast = number === FINAL_LEVEL;
  const rule = townRule(level);
  return {
    heading: isLast ? 'Final level' : `Level ${number} of ${FINAL_LEVEL}`,
    title,
    goal: `Survive ${hordes} hordes, then reach the van`,
    ...(rule ? { rule: `${rule.name}: ${rule.blurb}` } : {}),
  };
}
