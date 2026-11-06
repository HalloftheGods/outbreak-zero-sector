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
  { page: 'sound', label: 'Sound Test', needs: 'radio' },
  { page: 'options', label: 'Options' },
];

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
export function steppedIndex(index: number, step: number): number {
  const count = TITLE_MENU.length;
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

export function recordStats(best: BestRun | null): readonly RecordStat[] {
  return [
    { tag: 'Best score', value: String(best?.score ?? 0) },
    { tag: 'Hordes', value: String(best?.wave ?? 0) },
    { tag: 'Kills', value: String(best?.kills ?? 0) },
    { tag: 'Best time', value: best ? formatDuration(best.durationSec) : '--:--' },
  ];
}

const SHOWN_RUNS = 5;

export interface RecordRow {
  readonly key: string;
  readonly rank: string;
  readonly name: string;
  readonly score: number;
}

export function recordRows(leaderboard: readonly LeaderboardEntry[]): readonly RecordRow[] {
  return leaderboard.slice(0, SHOWN_RUNS).map((entry, index) => ({
    key: `${entry.timestamp}-${index}`,
    rank: `#${index + 1}`,
    name: entry.callsign || 'SURVIVOR',
    score: entry.score,
  }));
}
