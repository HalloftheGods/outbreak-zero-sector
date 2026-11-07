// The Records screen as a printed record book: six leaves, read two at a time on a wide screen and one at a time
// on a tall one. The leaves' words come from here, so the page only lays them out.

import type { DailyLog, DailyResult } from './daily-night.ts';
import { bestDay, dayLabel, nightFacts, recentDays, streakOf, todaysNight } from './daily-night.ts';
import { STAMPS } from './stamps.ts';
import type { StampBook, StampId } from './stamps.ts';

export type LeafId = 'bests' | 'ledger' | 'daily' | 'week' | 'stamps' | 'more_stamps';
export type BookMode = 'spread' | 'single';

export interface Leaf {
  readonly id: LeafId;
  /** The section named in the running head. */
  readonly head: string;
  /** The band colour, from the magazine's palette. */
  readonly color: 'tomato' | 'teal' | 'violet' | 'mustard' | 'pink' | 'sky';
}

export const RECORD_LEAVES: readonly Leaf[] = [
  { id: 'bests', head: 'Personal bests', color: 'tomato' },
  { id: 'ledger', head: 'The ledger', color: 'teal' },
  { id: 'daily', head: 'Daily Night', color: 'violet' },
  { id: 'week', head: 'The last seven nights', color: 'mustard' },
  { id: 'stamps', head: 'Stamps', color: 'pink' },
  { id: 'more_stamps', head: 'More stamps', color: 'sky' },
];

export const RECORD_BOOK_TITLE = "Survivor's Record Book";

/** The first leaf showing: a spread always opens on an even leaf, so its pair sits together. */
function firstShown(index: number, mode: BookMode): number {
  return mode === 'spread' ? index - (index % 2) : index;
}

/** The leaves open in front of the reader. */
export function openLeaves(index: number, mode: BookMode): readonly Leaf[] {
  const first = firstShown(index, mode);
  return mode === 'spread' ? RECORD_LEAVES.slice(first, first + 2) : [RECORD_LEAVES[first]];
}

/** The leaf a turn lands on, held inside the book. */
export function turnLeaves(index: number, by: number, mode: BookMode): number {
  const step = mode === 'spread' ? 2 : 1;
  const target = firstShown(index, mode) + by * step;
  return target < 0 || target >= RECORD_LEAVES.length ? firstShown(index, mode) : target;
}

/** "Pages 1-2 of 4", or "Page 3 of 4" one at a time. */
export function leafLabel(index: number, mode: BookMode): string {
  const shown = openLeaves(index, mode);
  const first = firstShown(index, mode) + 1;
  const pages = shown.length > 1 ? `Pages ${first}-${first + shown.length - 1}` : `Page ${first}`;
  return `${pages} of ${RECORD_LEAVES.length}`;
}

export interface DailySummary {
  readonly streak: number;
  /** Counted days kept on this device. */
  readonly nights: number;
  readonly best: { readonly label: string; readonly score: number; readonly level: number } | null;
  readonly tonight: { readonly label: string; readonly title: string; readonly line: string; readonly played: DailyResult | null };
}

export function dailySummary(log: DailyLog, now: Date = new Date()): DailySummary {
  const night = todaysNight(now);
  const facts = nightFacts(night);
  const best = bestDay(log);
  return {
    streak: streakOf(log, night.key),
    nights: Object.keys(log).length,
    best: best ? { label: dayLabel(best.key), score: best.result.score, level: best.result.level } : null,
    tonight: { label: dayLabel(night.key), title: facts.title, line: `${facts.level}, ${facts.difficulty}`, played: log[night.key] ?? null },
  };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface WeekLine {
  readonly key: string;
  readonly weekday: string;
  readonly label: string;
  readonly score: string;
  readonly detail: string;
  /** Counted, missed, or today and not yet played. */
  readonly stamp: 'counted' | 'missed' | 'open';
}

function stampFor(result: DailyResult | null, today: boolean): WeekLine['stamp'] {
  if (result) return 'counted';
  return today ? 'open' : 'missed';
}

const UNPLAYED: Readonly<Record<WeekLine['stamp'], string>> = { counted: '', open: 'Still open tonight', missed: 'No run' };

/** The last seven days, newest first, each stamped. */
export function weekLines(log: DailyLog, now: Date = new Date()): readonly WeekLine[] {
  const todayKey = todaysNight(now).key;
  return recentDays(log, todayKey, 7).map(({ key, result }) => {
    const [year, month, day] = key.split('-').map(Number);
    const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
    const practice = result && result.attempts > 1 ? `, ${result.attempts - 1} practice` : '';
    const stamp = stampFor(result, key === todayKey);
    return {
      key,
      weekday,
      label: dayLabel(key),
      score: result ? String(result.score) : '-',
      detail: result ? `Level ${result.level}, ${result.kills} kills${practice}` : UNPLAYED[stamp],
      stamp,
    };
  });
}

export interface StampCard {
  readonly id: StampId;
  readonly name: string;
  readonly how: string;
  /** The day it was earned, as the book prints it, or null while the ring is empty. */
  readonly earned: string | null;
  /** A slight turn of the stamp, the same every time for the same stamp. */
  readonly tilt: number;
}

/** The stamps the first stamps leaf holds; the rest go on the second. */
const FIRST_LEAF_STAMPS = 9;

/** One stamps leaf's cards, in book order. */
export function stampCards(book: StampBook, leaf: 'stamps' | 'more_stamps'): readonly StampCard[] {
  const defs = leaf === 'stamps' ? STAMPS.slice(0, FIRST_LEAF_STAMPS) : STAMPS.slice(FIRST_LEAF_STAMPS);
  return defs.map((def, index) => {
    const day = book.earned[def.id];
    return { id: def.id, name: def.name, how: def.how, earned: day ? dayLabel(day) : null, tilt: ((index * 7) % 11) - 5 };
  });
}

/** "6 of 17 stamped". */
export function stampTally(book: StampBook): string {
  const got = STAMPS.filter((def) => book.earned[def.id] !== undefined).length;
  return `${got} of ${STAMPS.length} stamped`;
}
