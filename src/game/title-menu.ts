import { formatDuration } from './hud-state.ts';
import type { SoundUnlock } from './sound-unlock.ts';
import type { BestRun, LeaderboardEntry } from './storage.ts';

/** The title's menu, what each item opens, and the words its pages show. The components only lay these out. */
export type TitlePage = 'play' | 'levels' | 'howto' | 'records' | 'sound' | 'options';

export interface TitleMenuItem {
  readonly page: TitlePage;
  readonly label: string;
  /** Shows as ??? until the player has found this. */
  readonly needs?: 'radio';
}

/** What an item reads as: its name, or ??? while what it needs has not been found. */
export function menuLabel(item: TitleMenuItem, unlock: SoundUnlock): string {
  const hidden = item.needs === 'radio' && !unlock.radio;
  return hidden ? '???' : item.label;
}

export const TITLE_MENU: readonly TitleMenuItem[] = [
  { page: 'play', label: 'Play' },
  { page: 'levels', label: 'Levels' },
  { page: 'howto', label: 'How to Play' },
  { page: 'records', label: 'Records' },
  { page: 'sound', label: 'Sound Test' },
  { page: 'options', label: 'Options' },
];

/** The menu as this game shows it. Home mode picks its level at the garage map, so the Levels page goes. */
export function titleMenu(homeLoop: boolean): readonly TitleMenuItem[] {
  return homeLoop ? TITLE_MENU.filter((item) => item.page !== 'levels') : TITLE_MENU;
}

export const CONTROLS: readonly (readonly [keys: string, action: string])[] = [
  ['WASD', 'Move'],
  ['Mouse', 'Aim, hold to fire'],
  ['F / Right', 'Shove & Stab, makes no noise'],
  ['E', 'Hold to search'],
  ['R', 'Reload'],
  ['H', 'Use a medkit'],
  ['1 2 3 Q', 'Weapons'],
  ['Tab / N', 'Town map'],
  ['Esc', 'Pause'],
  ['M', 'Mute'],
];

const MENU_STEPS: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  KeyW: -1,
  ArrowDown: 1,
  KeyS: 1,
};

/** Which way a key moves the menu, or 0 if it does not. */
export function menuStep(code: string): number {
  return MENU_STEPS[code] ?? 0;
}

/** The item a step lands on, wrapping at both ends. */
export function steppedIndex(index: number, step: number, count = TITLE_MENU.length): number {
  return (index + step + count) % count;
}

export interface KeyFocus {
  readonly focusInMenu: boolean;
  readonly focusOnControl: boolean;
}

/** The menu answers keys unless focus is on some other control, which then answers its own Enter. */
export function menuOwnsKey(focus: KeyFocus): boolean {
  return focus.focusInMenu || !focus.focusOnControl;
}

export function isConfirmKey(code: string): boolean {
  return code === 'Enter' || code === 'NumpadEnter';
}

/** The setup page's one button, which also says why it cannot be pressed yet. */
export function setupActionLabel(coop: boolean, artReady: boolean, connecting: boolean): string {
  if (!artReady) return 'Loading...';
  if (connecting) return 'Connecting...';
  return coop ? 'Join' : 'Start';
}

export interface RecordStat {
  readonly tag: string;
  readonly value: string;
}

const CLASSIC_TAGS = ['Best classic score', 'Classic hordes', 'Classic kills', 'Best classic time'] as const;
const PLAIN_TAGS = ['Best score', 'Hordes', 'Kills', 'Best time'] as const;

/** The trip-end recorder marks what it saves; an entry without the mark is a whole run from before the bunker. */
interface TripMarked {
  readonly trip?: boolean;
}

/** Once the game plays from the bunker, an unmarked entry is a whole run, which a trip cannot be compared to. */
function isClassic(entry: TripMarked, homeLoop: boolean): boolean {
  return homeLoop && entry.trip !== true;
}

export function recordStats(best: (BestRun & TripMarked) | null, homeLoop = false): readonly RecordStat[] {
  const noRunYet = best === null;
  const labelledClassic = noRunYet ? homeLoop : isClassic(best, homeLoop);
  const tags = labelledClassic ? CLASSIC_TAGS : PLAIN_TAGS;
  return [
    { tag: tags[0], value: String(best?.score ?? 0) },
    { tag: tags[1], value: String(best?.wave ?? 0) },
    { tag: tags[2], value: String(best?.kills ?? 0) },
    { tag: tags[3], value: best ? formatDuration(best.durationSec) : '--:--' },
  ];
}

const SHOWN_RUNS = 5;

export interface RecordRow {
  readonly key: string;
  readonly rank: string;
  readonly name: string;
  readonly score: number;
  /** A whole run from before the bunker. */
  readonly classic: boolean;
}

export function recordRows(leaderboard: readonly (LeaderboardEntry & TripMarked)[], homeLoop = false): readonly RecordRow[] {
  return leaderboard.slice(0, SHOWN_RUNS).map((entry, index) => ({
    key: `${entry.timestamp}-${index}`,
    rank: `#${index + 1}`,
    name: entry.callsign || 'SURVIVOR',
    score: entry.score,
    classic: isClassic(entry, homeLoop),
  }));
}
