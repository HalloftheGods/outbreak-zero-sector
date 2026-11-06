import { LEVELS } from '../../shared/levels.ts';
import type { LevelDef } from '../../shared/levels.ts';

/** Segments in every meter, as on the difficulty and survivor cards. */
export const LEVEL_METER_SLOTS = 5;

type LevelMeterKey = 'hordes' | 'difficulty' | 'brute' | 'runner';

export interface LevelMeter {
  readonly key: LevelMeterKey;
  readonly label: string;
  /** Segments lit out of LEVEL_METER_SLOTS. */
  readonly slots: number;
}

const valueOf = (def: LevelDef, key: LevelMeterKey): number =>
  key === 'hordes' || key === 'difficulty' ? def[key] : def.mix[key];

/** Hordes and difficulty run from one segment on the gentlest level to all five on the hardest. */
function rangeSlots(key: LevelMeterKey, value: number): number {
  const all = LEVELS.map((each) => valueOf(each, key));
  const low = Math.min(...all);
  const span = Math.max(...all) - low;
  return span > 0 ? 1 + Math.round(((LEVEL_METER_SLOTS - 1) * (value - low)) / span) : 1;
}

/** A share of the crowd is empty while that kind does not show up yet, and full at the run's largest share. */
function shareSlots(key: LevelMeterKey, value: number): number {
  const most = Math.max(...LEVELS.map((each) => valueOf(each, key)));
  const absent = value <= 0 || most <= 0;
  if (absent) return 0;
  return Math.max(1, Math.round((LEVEL_METER_SLOTS * value) / most));
}

const METERS: readonly { key: LevelMeterKey; label: string; slots: typeof rangeSlots }[] = [
  { key: 'hordes', label: 'Hordes', slots: rangeSlots },
  { key: 'difficulty', label: 'Difficulty', slots: rangeSlots },
  { key: 'brute', label: 'Brutes', slots: shareSlots },
  { key: 'runner', label: 'Runners', slots: shareSlots },
];

/** The Levels page's at-a-glance bars for one level, measured against the rest of the run. */
export function levelMeters(def: LevelDef): LevelMeter[] {
  return METERS.map(({ key, label, slots }) => ({ key, label, slots: slots(key, valueOf(def, key)) }));
}
