// How a quest's progress moves. The save is never changed in place: each step returns a new quest state.

import type { StationId, TripReceipt } from '../../../shared/home-protocol.ts';
import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId } from '../../../shared/home-protocol.ts';
import { questOf, targetOf } from './quest-data.ts';
import type { Objective, QuestDef, QuestFilter } from './quest-data.ts';
import type { QuestState } from './quest-state.ts';
import type { TripTally } from './quest-tally.ts';

/** Does this trip count for the quest at all: the right level, the right survivor, a big enough party. */
function passes(filter: QuestFilter | undefined, receipt: TripReceipt, tally: TripTally): boolean {
  if (!filter) return true;
  if (filter.minLevel !== undefined && receipt.level < filter.minLevel) return false;
  if (filter.survivor !== undefined && tally.survivor !== filter.survivor) return false;
  if (filter.minParty !== undefined && tally.party < filter.minParty) return false;
  return true;
}

function broughtHome(objective: Extract<Objective, { kind: 'bring_home' }>, receipt: TripReceipt): number {
  const gear = receipt.gear;
  if (objective.what === 'jewel') return receipt.jewels.small + receipt.jewels.large;
  if (!gear) return 0;
  if (objective.what === 'medkit') return gear.medkits;
  if (objective.what === 'gun') return Object.keys(gear.guns).length;
  return gear.guns[objective.what] ? 1 : 0;
}

/** What one banked trip adds to a counter, honouring a zombie filter on kills. */
function counted(objective: Extract<Objective, { kind: 'tally' }>, filter: QuestFilter | undefined, tally: TripTally): number {
  if (objective.counter === 'kills' && filter?.zombie) return tally.killsBy[filter.zombie];
  return tally.counts[objective.counter];
}

/** Progress after one banked trip, or the same number if the trip does not move this quest. */
function afterBanked(def: QuestDef, progress: number, receipt: TripReceipt, tally: TripTally): number {
  const { objective } = def;
  if (!passes(def.filter, receipt, tally)) return progress;
  const target = targetOf(objective);
  if (objective.kind === 'bank' || objective.kind === 'streak') return Math.min(target, progress + 1);
  if (objective.kind === 'receipt_total') return Math.min(target, progress + receipt[objective.field]);
  if (objective.kind === 'fast') return receipt.seconds <= objective.seconds ? 1 : progress;
  if (objective.kind === 'bring_home') return Math.max(progress, Math.min(target, broughtHome(objective, receipt)));
  if (objective.kind === 'tally') {
    const value = counted(objective, def.filter, tally);
    if (objective.scope === 'total') return Math.min(target, progress + value);
    const spoiled = objective.atMost !== undefined && tally.counts[objective.atMost.counter] > objective.atMost.count;
    return spoiled ? progress : Math.max(progress, Math.min(target, value));
  }
  return progress;
}

function mapActive(quests: QuestState, step: (def: QuestDef, progress: number, merchant: MerchantId) => number): QuestState {
  let changed = false;
  const active: QuestState['active'] = { ...quests.active };
  for (const merchant of MERCHANT_IDS) {
    const slot = quests.active[merchant];
    const def = slot && questOf(slot.id);
    if (!slot || !def) continue;
    const next = step(def, slot.progress, merchant);
    if (next === slot.progress) continue;
    active[merchant] = { ...slot, progress: next };
    changed = true;
  }
  return changed ? { ...quests, active } : quests;
}

/**
 * The only path that moves trip progress. A banked trip counts what it brought and did; a death moves nothing
 * except resetting streaks. Returns the same object when nothing moved.
 */
export function applyTripToQuests(quests: QuestState, receipt: TripReceipt, tally: TripTally): QuestState {
  if (receipt.outcome === 'died') {
    return mapActive(quests, (def, progress) => (def.objective.kind === 'streak' ? 0 : progress));
  }
  return mapActive(quests, (def, progress) => afterBanked(def, progress, receipt, tally));
}

/** Jewels melted at the forge, counted toward any active smelt quest. */
export function noteSmelted(quests: QuestState, jewels: number): QuestState {
  if (jewels <= 0) return quests;
  return mapActive(quests, (def, progress) => (def.objective.kind === 'smelt' ? Math.min(targetOf(def.objective), progress + jewels) : progress));
}

/** A station was opened, counted toward any active visit quest for it. */
export function noteVisit(quests: QuestState, station: StationId): QuestState {
  return mapActive(quests, (def, progress) => (def.objective.kind === 'visit' && def.objective.station === station ? 1 : progress));
}

export const isReady = (def: QuestDef, progress: number): boolean => progress >= targetOf(def.objective);
