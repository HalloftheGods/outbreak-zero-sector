// Quests read back from storage, one field at a time. A bad entry is dropped alone, and an unreadable block falls back to the blank.

import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId } from '../../../shared/home-protocol.ts';
import { questOf, targetOf } from './quest-data.ts';
import type { ActiveQuest, QuestState } from './quest-state.ts';

type Fields = Record<string, unknown>;

const isFields = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** An active quest that still exists, belongs to this merchant, and has progress inside its bar. */
function reviveActive(value: unknown, merchant: MerchantId): ActiveQuest | null {
  if (!isFields(value) || typeof value.id !== 'string') return null;
  const def = questOf(value.id);
  if (!def || def.giver !== merchant) return null;
  const progress = isNumber(value.progress) ? Math.min(targetOf(def.objective), Math.max(0, Math.floor(value.progress))) : 0;
  return { id: def.id, progress, acceptedAt: isNumber(value.acceptedAt) ? value.acceptedAt : 0 };
}

const reviveDone = (value: unknown): string[] => {
  const ids = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && questOf(id)?.repeat === 'once') : [];
  return [...new Set(ids)];
};

const reviveJob = (value: unknown, merchant: MerchantId): string | null => {
  const def = typeof value === 'string' ? questOf(value) : undefined;
  return def && def.repeat === 'job' && def.giver === merchant ? def.id : null;
};

/** `blank` is what a new save holds, and stands in for anything that does not read. */
export function reviveQuests(value: unknown, blank: QuestState): QuestState {
  if (!isFields(value) || !isNumber(value.seed) || !isNumber(value.rolls)) return blank;
  const active: QuestState['active'] = {};
  const jobs = { ...blank.jobs };
  const rawActive = isFields(value.active) ? value.active : {};
  const rawJobs = isFields(value.jobs) ? value.jobs : {};
  for (const merchant of MERCHANT_IDS) {
    const quest = reviveActive(rawActive[merchant], merchant);
    if (quest) active[merchant] = quest;
    jobs[merchant] = reviveJob(rawJobs[merchant], merchant);
  }
  return { seed: value.seed, rolls: Math.max(0, Math.floor(value.rolls)), active, done: reviveDone(value.done), jobs };
}
