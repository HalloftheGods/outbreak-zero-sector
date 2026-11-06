import type { GameEvent } from '../../shared/protocol.ts';
import type { GunEffect } from '../../shared/round-effect-data.ts';

/** The sparks a status makes the moment it takes hold. */
export interface StatusBurst {
  readonly colors: readonly string[];
  readonly count: number;
  readonly speed: number;
  /** Lit after the light pass, so it glows. */
  readonly emissive: boolean;
}

const BURSTS: Record<GunEffect, StatusBurst> = {
  incendiary: { colors: ['#ffe36b', '#ff8a1c', '#d4410f'], count: 8, speed: 70, emissive: true },
  acid: { colors: ['#b6f24a', '#8fd13a', '#5b8a1c'], count: 6, speed: 45, emissive: false },
  piercing: { colors: ['#e8f4ff', '#ffffff'], count: 5, speed: 90, emissive: true },
  tranq: { colors: ['#d6efff', '#6fb8ff'], count: 4, speed: 30, emissive: false },
};

/** Fewer sparks on a refresh-heavy fast gun: only a status that newly took hold reaches here, and a caught fire is lighter. */
export function burstFor(event: Extract<GameEvent, { type: 'zombie_status' }>): StatusBurst {
  const base = BURSTS[event.effect];
  return event.caught ? { ...base, count: Math.ceil(base.count / 2) } : base;
}
