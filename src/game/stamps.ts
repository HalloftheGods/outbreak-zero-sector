// Achievements, kept as rubber stamps in the record book. They are read off the events every client already
// gets, so play is the same with them or without them, and they are kept on this device.

import { nightEventFor } from '../../shared/night-events.ts';
import type { EntityId, GameEvent } from '../../shared/protocol.ts';
import { browserStore, readJson, writeJson } from './storage.ts';
import type { Store } from './storage.ts';

export type StampId =
  | 'first_blood' | 'headhunter' | 'massacre' | 'crowd_control' | 'firestarter' | 'flare_up' | 'special_delivery'
  | 'close_shave' | 'howler_down' | 'mother_down' | 'butcher_down' | 'blood_moon' | 'into_the_fog' | 'halfway'
  | 'last_stop' | 'daily_bread' | 'three_nights';

export interface StampDef {
  readonly id: StampId;
  readonly name: string;
  /** How to earn it, shown under the empty ring before it is. */
  readonly how: string;
}

export const STAMPS: readonly StampDef[] = [
  { id: 'first_blood', name: 'First Blood', how: 'Put down your first zombie.' },
  { id: 'headhunter', name: 'Headhunter', how: 'Land 50 headshots, across every run.' },
  { id: 'massacre', name: 'Massacre', how: 'Chain five kills, each within a breath of the last.' },
  { id: 'crowd_control', name: 'Crowd Control', how: 'Kill 100 in a single run.' },
  { id: 'firestarter', name: 'Firestarter', how: 'Throw 10 molotovs, across every run.' },
  { id: 'flare_up', name: 'Flare Up', how: 'Light a flare.' },
  { id: 'special_delivery', name: 'Special Delivery', how: 'Grab something from a supply drop.' },
  { id: 'close_shave', name: 'Close Shave', how: 'Make a kill with almost no health left.' },
  { id: 'howler_down', name: 'Howler Down', how: 'Kill the Howler.' },
  { id: 'mother_down', name: 'Mother Down', how: 'Kill Mother.' },
  { id: 'butcher_down', name: 'Butcher Down', how: 'Kill the Butcher.' },
  { id: 'blood_moon', name: 'Blood Moon', how: 'See off a horde under a blood moon.' },
  { id: 'into_the_fog', name: 'Into the Fog', how: 'Get out of a town in the fog.' },
  { id: 'halfway', name: 'Halfway Home', how: 'Reach level 5.' },
  { id: 'last_stop', name: 'Last Stop', how: 'Survive all ten towns.' },
  { id: 'daily_bread', name: 'Daily Bread', how: 'Finish a Daily Night that counts.' },
  { id: 'three_nights', name: 'Three Nights', how: 'Play the Daily Night three days in a row.' },
];

const STAMPS_KEY = 'outbreak.stamps';
const HEADSHOTS_FOR_STAMP = 50;
const MOLOTOVS_FOR_STAMP = 10;
const KILLS_FOR_STAMP = 100;
const CHAIN_FOR_STAMP = 5;
const HALFWAY_LEVEL = 5;
/** Close enough to a landed drop to have taken from it. */
const DROP_REACH = 48;
const BOSS_STAMPS = { howler: 'howler_down', mother: 'mother_down', butcher: 'butcher_down' } as const;

export interface StampBook {
  /** Each earned stamp and the day it was earned (YYYY-MM-DD). */
  readonly earned: Readonly<Partial<Record<StampId, string>>>;
  /** Lifetime counts the counting stamps need. */
  readonly headshots: number;
  readonly molotovs: number;
}

const EMPTY: StampBook = { earned: {}, headshots: 0, molotovs: 0 };

export function loadStamps(store: Store | null = browserStore()): StampBook {
  const raw = readJson(store, STAMPS_KEY);
  if (typeof raw !== 'object' || raw === null) return EMPTY;
  const r = raw as Record<string, unknown>;
  const known = new Set<string>(STAMPS.map((stamp) => stamp.id));
  const earned: Partial<Record<StampId, string>> = {};
  const entries = typeof r.earned === 'object' && r.earned !== null ? Object.entries(r.earned) : [];
  for (const [id, day] of entries) {
    const valid = known.has(id) && typeof day === 'string';
    if (valid) earned[id as StampId] = day as string;
  }
  const count = (v: unknown): number => (Number.isFinite(v) ? Number(v) : 0);
  return { earned, headshots: count(r.headshots), molotovs: count(r.molotovs) };
}

/** What a run's reader needs to know besides the events. */
export interface StampContext {
  readonly localId: EntityId | null;
  readonly level: number;
  readonly mapSeed: number;
  /** The local player's kills this run. */
  readonly kills: number;
  /** The landed supply drop, if any, for telling a grab from it. */
  readonly drop: { readonly x: number; readonly y: number } | null;
}

/** Folds one snapshot's events into the book, and says which stamps it newly earned. */
export function readStamps(book: StampBook, events: readonly GameEvent[], ctx: StampContext, today: string): { book: StampBook; earned: StampId[] } {
  const earned: StampId[] = [];
  const has = new Set(Object.keys(book.earned));
  const earn = (id: StampId): void => {
    if (has.has(id)) return;
    has.add(id);
    earned.push(id);
  };
  let { headshots, molotovs } = book;
  const mine = (id: EntityId | null): boolean => id !== null && id === ctx.localId;
  const event = nightEventFor(ctx.mapSeed, ctx.level)?.id ?? null;
  for (const e of events) {
    if (e.type === 'zombie_die' && mine(e.killerId)) {
      earn('first_blood');
      if ((e.chain ?? 1) >= CHAIN_FOR_STAMP) earn('massacre');
    } else if (e.type === 'headshot' && mine(e.playerId)) {
      headshots += 1;
    } else if (e.type === 'molotov_burst' && mine(e.playerId)) {
      molotovs += 1;
    } else if (e.type === 'flare_lit' && mine(e.playerId)) {
      earn('flare_up');
    } else if (e.type === 'pickup' && mine(e.playerId)) {
      const fromDrop = ctx.drop !== null && Math.hypot(e.x - ctx.drop.x, e.y - ctx.drop.y) <= DROP_REACH;
      if (fromDrop) earn('special_delivery');
    } else if (e.type === 'boss_down') {
      earn(BOSS_STAMPS[e.boss]);
    } else if (e.type === 'wave_clear' && event === 'blood_moon') {
      earn('blood_moon');
    } else if (e.type === 'level_complete' && event === 'fog') {
      earn('into_the_fog');
    } else if (e.type === 'level_start' && e.level >= HALFWAY_LEVEL) {
      earn('halfway');
    } else if (e.type === 'game_over' && e.stats.outcome === 'victory') {
      earn('last_stop');
    }
  }
  if (headshots >= HEADSHOTS_FOR_STAMP) earn('headhunter');
  if (molotovs >= MOLOTOVS_FOR_STAMP) earn('firestarter');
  if (ctx.kills >= KILLS_FOR_STAMP) earn('crowd_control');
  const stamped = Object.fromEntries(earned.map((id) => [id, today]));
  return { book: { earned: { ...book.earned, ...stamped }, headshots, molotovs }, earned };
}

/** Stamps earned off the run's events, saved. Returns the new ones, for the callout. */
export function stampSnapshot(events: readonly GameEvent[], ctx: StampContext, today: string, store: Store | null = browserStore()): StampId[] {
  const before = loadStamps(store);
  const { book, earned } = readStamps(before, events, ctx, today);
  const changed = earned.length > 0 || book.headshots !== before.headshots || book.molotovs !== before.molotovs;
  if (changed) writeJson(store, STAMPS_KEY, book);
  return earned;
}

/** Stamps given outright, off a moment rather than an event: a close call, a Daily Night counted, a streak. */
export function giveStamps(ids: readonly StampId[], today: string, store: Store | null = browserStore()): StampId[] {
  const book = loadStamps(store);
  const fresh = ids.filter((id) => book.earned[id] === undefined);
  if (fresh.length === 0) return [];
  writeJson(store, STAMPS_KEY, { ...book, earned: { ...book.earned, ...Object.fromEntries(fresh.map((id) => [id, today])) } });
  return fresh;
}

export const stampName = (id: StampId): string => STAMPS.find((stamp) => stamp.id === id)?.name ?? id;
