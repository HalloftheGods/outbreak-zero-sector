import { describe, expect, it } from 'vitest';
import { parseClientPacket } from '../server/packets.ts';
import { WEAPONS } from '../shared/constants.ts';
import { GUN_POWER_CAP, GUN_SLOTS, QUIRK_ORDER, UPGRADES } from '../shared/gun-upgrade-data.ts';
import type { GunQuirk } from '../shared/gun-upgrade-data.ts';
import { effectOf, fitUpgrade, gearField, gunStats, moveUpgrade } from '../shared/gun-upgrades.ts';
import type { GunFit } from '../shared/gun-upgrades.ts';
import { levelDef } from '../shared/levels.ts';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { WeaponId } from '../shared/protocol.ts';
import { BURN_PULSE_DAMAGE, BURN_PULSE_SEC, BURN_SEC, CORROSION_BRUTE_PER_STACK, CORROSION_MAX_STACKS, CORROSION_PER_STACK, EFFECT_ORDER, GUN_EFFECTS, KIT_CARRY_CAP, KIT_ORDER } from '../shared/round-effect-data.ts';
import type { GunEffect } from '../shared/round-effect-data.ts';
import { canFitEffect, canMoveEffect, effectOfKit, fitEffect, isKitPickup, moveEffect, noKits, takeKit } from '../shared/round-effects.ts';
import type { PlayerState } from '../shared/sim-state.ts';
import { isBenchAction } from '../shared/workbench.ts';
import { parseServerPacket } from '../src/network/packet-guards.ts';
import { quietSim } from './helpers/sim-harness.ts';

function bench(): { sim: ReturnType<typeof quietSim>['sim']; p: PlayerState } {
  const { sim, state } = quietSim();
  const [p] = state.players;
  p.guns.carbine = { ammo: 30 };
  p.guns.shotgun = { ammo: 6 };
  p.owned = [...WEAPON_ORDER];
  state.bench = { left: Infinity };
  return { sim, p };
}

function everyBuild(weapon: WeaponId, effect: GunEffect): GunFit[] {
  const builds: GunFit[] = [];
  const quirks: (GunQuirk | null)[] = [null, ...QUIRK_ORDER];
  for (let damage = 0; damage <= UPGRADES.damage.maxRank; damage++) {
    for (let fireRate = 0; fireRate <= UPGRADES.fireRate.maxRank; fireRate++) {
      const fits = damage + fireRate <= GUN_SLOTS[weapon];
      if (fits) builds.push(...quirks.map((quirk) => ({ ranks: { damage, fireRate }, quirk, effect })));
    }
  }
  return builds;
}

const directPower = (weapon: WeaponId, fit: GunFit): number => {
  const stats = gunStats(weapon, fit);
  const stock = WEAPONS[weapon];
  return (stats.damage / stock.damage) * (stock.fireIntervalMs / stats.fireIntervalMs);
};

describe('round kits in the bag', () => {
  it('each name the effect they fit', () => {
    for (const effect of EFFECT_ORDER) expect(effectOfKit(GUN_EFFECTS[effect].kit)).toBe(effect);
    expect(KIT_ORDER.every(isKitPickup)).toBe(true);
    expect(isKitPickup('barrel')).toBe(false);
  });

  it('stop at the carry cap, so the next one stays on the floor', () => {
    const { p } = bench();
    for (let i = 0; i < KIT_CARRY_CAP; i++) expect(takeKit(p, 'acid_kit')).toBe(true);
    expect(takeKit(p, 'acid_kit')).toBe(false);
    expect(p.kits.acid).toBe(KIT_CARRY_CAP);
  });

  it('show in the gear field, and only when there are some', () => {
    const { p } = bench();
    expect(gearField(p)).toEqual({});
    p.kits.tranq = 1;
    expect(gearField(p).gear?.kits).toEqual({ ...noKits(), tranq: 1 });
    p.kits.tranq = 0;
    p.parts.barrel = 1;
    expect(gearField(p).gear).not.toHaveProperty('kits');
  });
});

describe('fitting an effect at the bench', () => {
  it('uses the kit and puts the effect on the gun, apart from its slots', () => {
    const { sim, p } = bench();
    p.kits.incendiary = 1;
    sim.benchCommand('a', { kind: 'fit_effect', weapon: 'pistol', effect: 'incendiary' });
    expect(p.kits.incendiary).toBe(0);
    expect(effectOf(p.guns.pistol?.fit)).toBe('incendiary');
    expect(Object.values(p.guns.pistol?.fit?.ranks ?? {})).toEqual([]);
  });

  it('replaces what was there', () => {
    const { p } = bench();
    p.kits.incendiary = 1;
    p.kits.acid = 1;
    fitEffect(p, 'pistol', 'incendiary');
    expect(fitEffect(p, 'pistol', 'acid')).toBe(true);
    expect(effectOf(p.guns.pistol?.fit)).toBe('acid');
  });

  it('will not spend a kit on the effect the gun already has', () => {
    const { p } = bench();
    p.kits.tranq = 2;
    fitEffect(p, 'pistol', 'tranq');
    expect(canFitEffect(p.kits, p.guns.pistol?.fit, 'tranq')).toBe(false);
    expect(fitEffect(p, 'pistol', 'tranq')).toBe(false);
    expect(p.kits.tranq).toBe(1);
  });

  it('needs the kit and the gun', () => {
    const { p } = bench();
    expect(fitEffect(p, 'pistol', 'tranq')).toBe(false);
    p.kits.tranq = 1;
    delete p.guns.shotgun;
    expect(fitEffect(p, 'shotgun', 'tranq')).toBe(false);
    expect(p.kits.tranq).toBe(1);
  });

  it('does nothing out in town', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.kits.acid = 1;
    sim.benchCommand('a', { kind: 'fit_effect', weapon: 'pistol', effect: 'acid' });
    expect(p.kits.acid).toBe(1);
  });

  it('survives upgrades going on and moving off, and keeps the ranks and quirk', () => {
    const { p } = bench();
    p.parts = { barrel: 2, grip: 0, magazine: 0, suppressor: 0, toolkit: 1 };
    p.kits.piercing = 1;
    p.guns.pistol = { ammo: 12, fit: { ranks: {}, quirk: 'hot_loads' } };
    fitEffect(p, 'pistol', 'piercing');
    fitUpgrade(p, 'pistol', 'damage');
    moveUpgrade(p, 'damage', 'pistol', 'carbine');
    expect(p.guns.pistol.fit).toMatchObject({ quirk: 'hot_loads', effect: 'piercing' });
  });
});

describe('moving an effect with a toolkit', () => {
  it('spends the toolkit and takes the effect across', () => {
    const { sim, p } = bench();
    p.parts.toolkit = 1;
    p.guns.pistol = { ammo: 12, fit: { ranks: { damage: 1 }, quirk: null, effect: 'acid' } };
    sim.benchCommand('a', { kind: 'move_effect', from: 'pistol', to: 'carbine' });
    expect(p.parts.toolkit).toBe(0);
    expect(effectOf(p.guns.pistol.fit)).toBeNull();
    expect(p.guns.pistol.fit).toEqual({ ranks: { damage: 1 }, quirk: null });
    expect(effectOf(p.guns.carbine?.fit)).toBe('acid');
  });

  it('needs a toolkit, an effect to move and a gun with none to lose', () => {
    const { p } = bench();
    const acid: GunFit = { ranks: {}, quirk: null, effect: 'acid' };
    const tranq: GunFit = { ranks: {}, quirk: null, effect: 'tranq' };
    const parts = { ...p.parts, toolkit: 1 };
    const pistol = { weapon: 'pistol', fit: acid } as const;
    expect(canMoveEffect(parts, pistol, { weapon: 'carbine', fit: undefined })).toBe(true);
    expect(canMoveEffect(p.parts, pistol, { weapon: 'carbine', fit: undefined })).toBe(false);
    expect(canMoveEffect(parts, { weapon: 'pistol', fit: undefined }, { weapon: 'carbine', fit: undefined })).toBe(false);
    expect(canMoveEffect(parts, pistol, { weapon: 'carbine', fit: tranq })).toBe(false);
    expect(canMoveEffect(parts, pistol, { weapon: 'pistol', fit: acid })).toBe(false);
  });

  it('changes nothing when it cannot', () => {
    const { p } = bench();
    p.parts.toolkit = 1;
    expect(moveEffect(p, 'pistol', 'carbine')).toBe(false);
    expect(p.parts.toolkit).toBe(1);
  });
});

describe('the power cap', () => {
  it.each(WEAPON_ORDER)('holds the %s under it on direct damage, effect or none', (weapon) => {
    for (const effect of EFFECT_ORDER) {
      for (const fit of everyBuild(weapon, effect)) expect(directPower(weapon, fit)).toBeLessThanOrEqual(GUN_POWER_CAP + 1e-9);
    }
  });

  it.each(WEAPON_ORDER)('counts what an effect adds on the %s', (weapon) => {
    for (const effect of EFFECT_ORDER) {
      for (const fit of everyBuild(weapon, effect)) {
        expect(directPower(weapon, fit) * (1 + GUN_EFFECTS[effect].power)).toBeLessThanOrEqual(GUN_POWER_CAP + 1e-9);
      }
    }
  });

  it('leaves a stock gun firing stock rounds under every effect but tranq', () => {
    for (const effect of ['incendiary', 'acid', 'piercing'] as const) {
      expect(gunStats('pistol', { ranks: {}, quirk: null, effect }).damage).toBeCloseTo(WEAPONS.pistol.damage);
    }
    expect(gunStats('pistol', { ranks: {}, quirk: null, effect: 'tranq' }).damage).toBeCloseTo(WEAPONS.pistol.damage * 0.7);
  });

  it('holds a fully corroded target to the cap from the gun that corroded it', () => {
    const best = Math.max(...everyBuild('carbine', 'acid').map((fit) => directPower('carbine', fit)));
    expect(best * (1 + CORROSION_MAX_STACKS * CORROSION_PER_STACK)).toBeLessThanOrEqual(GUN_POWER_CAP + 1e-9);
  });
});

describe('level 10', () => {
  const finalWave = levelDef(10).hordes;
  const bruteHealth = 520 * (1 + 0.07 * (finalWave - 1));
  const walkerHealth = 60 * (1 + 0.07 * (finalWave - 1));
  const burnPerSec = BURN_PULSE_DAMAGE / BURN_PULSE_SEC;
  const fullAcid = 1 + CORROSION_MAX_STACKS * CORROSION_PER_STACK;

  /** The hardest case: a capped gun, on a body kept alight and fully corroded by someone else. */
  function secondsToKill(health: number, weapon: WeaponId, power: number, burning: boolean): number {
    const stock = WEAPONS[weapon];
    const pellets = Math.max(1, stock.pellets / 2);
    const gunPerSec = (stock.damage * pellets * power * 1000) / stock.fireIntervalMs;
    return health / ((gunPerSec + (burning ? burnPerSec : 0)) * fullAcid);
  }

  it.each(WEAPON_ORDER)('a burning, corroded brute still takes a capped %s close to half as long as a stock gun on a clean one', (weapon) => {
    const stockOnClean = secondsToKill(bruteHealth, weapon, 1, false) * fullAcid;
    const worst = secondsToKill(bruteHealth, weapon, GUN_POWER_CAP, true);
    expect(worst).toBeGreaterThan(stockOnClean * 0.45);
  });

  /** Seconds to kill a brute with one build, firing flat out. Each acid hit softens the body for the next. */
  function secondsToKillBrute(weapon: WeaponId, fit: GunFit): number {
    const stats = gunStats(weapon, fit);
    const hitting = Math.max(1, WEAPONS[weapon].pellets / 2);
    const corrodes = fit.effect === 'acid';
    let health = bruteHealth;
    let stacks = 0;
    let shots = 0;
    let hit = stats.damage * hitting;
    while (health > hit) {
      health -= hit;
      if (corrodes) stacks = Math.min(CORROSION_MAX_STACKS, stacks + 1);
      hit = stats.damage * hitting * (1 + stacks * CORROSION_BRUTE_PER_STACK);
      shots += 1;
    }
    // The last shot counts for the share of it that was needed, so a gun is not marked down for overkill.
    return ((shots + health / hit) * stats.fireIntervalMs) / 1000;
  }

  const strongest = (weapon: WeaponId, effect: GunEffect | undefined): GunFit =>
    everyBuild(weapon, effect as GunEffect).map((fit) => ({ ...fit, effect })).sort((a, b) => directPower(weapon, b) - directPower(weapon, a))[0];

  it.each(WEAPON_ORDER)('a capped acid %s beats a capped plain one on a brute, but not by a landslide', (weapon) => {
    const plain = secondsToKillBrute(weapon, strongest(weapon, undefined));
    const acid = secondsToKillBrute(weapon, strongest(weapon, 'acid'));
    expect(acid).toBeLessThan(plain);
    expect(acid).toBeGreaterThan(plain * 0.75);
  });

  it('a burn alone is well short of a walker, even on full acid', () => {
    expect(BURN_SEC * burnPerSec * fullAcid).toBeLessThan(walkerHealth / 2);
  });

  it('a burn is a sliver of a brute', () => {
    expect(BURN_SEC * burnPerSec * fullAcid).toBeLessThan(bruteHealth * 0.06);
  });
});

describe('the wire', () => {
  const zombie = { id: 'z1', type: 'walker', x: 1, y: 2, angle: 0, health: 10, maxHealth: 10, attacking: false };
  const frame = (overrides: Record<string, unknown>): string => JSON.stringify({
    type: 'snapshot', tick: 1, phase: 'wave', level: 1, mapSeed: 1, wave: 1, intermission: 0, hostiles: 0,
    players: [], zombies: [], bullets: [], pickups: [], exit: null, openedContainers: [], events: [], gameOver: null,
    ...overrides,
  });

  it('takes an older frame with none of this in it', () => {
    expect(parseServerPacket(frame({ zombies: [zombie] }))).not.toBeNull();
  });

  it('takes status on a zombie, an effect on a bullet and the new event', () => {
    const bullet = { id: 'b1', shooterId: 'a', x: 0, y: 0, vx: 1, vy: 1, effect: 'acid' };
    const event = { type: 'zombie_status', effect: 'incendiary', zombieId: 'z1', zombieType: 'walker', x: 1, y: 2, caught: true };
    const packet = frame({ zombies: [{ ...zombie, burning: true, corrosion: 2, slowed: true }], bullets: [bullet], events: [event] });
    expect(parseServerPacket(packet)).not.toBeNull();
  });

  it('takes a kit on the floor', () => {
    for (const type of KIT_ORDER) expect(parseServerPacket(frame({ pickups: [{ id: 'i1', type, x: 1, y: 2 }] }))).not.toBeNull();
  });

  it('turns away nonsense in the new fields', () => {
    expect(parseServerPacket(frame({ zombies: [{ ...zombie, burning: 'yes' }] }))).toBeNull();
    expect(parseServerPacket(frame({ zombies: [{ ...zombie, corrosion: 'lots' }] }))).toBeNull();
    expect(parseServerPacket(frame({ bullets: [{ id: 'b', shooterId: 'a', x: 0, y: 0, vx: 1, vy: 1, effect: 'plasma' }] }))).toBeNull();
  });

  it('carries gear with kits and an effect, and gear from before them', () => {
    const player = {
      id: 'a', name: 'a', moving: false, knife: false, status: 'alive', weapon: 'pistol', owned: ['pistol'],
      ammoBag: { pistol: 0, carbine: 0, shotgun: 0 }, mags: { pistol: 0, carbine: 0, shotgun: 0 }, indoors: null,
      skin: 0, x: 0, y: 0, angle: 0, health: 1, maxHealth: 1, ammo: 0, magSize: 1, reserve: 0, medkits: 0,
      reload: 0, search: 0, bleedout: 0, revive: 0, score: 0, kills: 0, lastInputSeq: 0,
    };
    const parts = { barrel: 0, grip: 0, magazine: 0, suppressor: 0, toolkit: 0 };
    const older = { parts, fits: { pistol: { ranks: {}, quirk: null } } };
    const newer = { parts, fits: { pistol: { ranks: {}, quirk: null, effect: 'tranq' } }, kits: noKits() };
    expect(parseServerPacket(frame({ players: [{ ...player, gear: older }] }))).not.toBeNull();
    expect(parseServerPacket(frame({ players: [{ ...player, gear: newer }] }))).not.toBeNull();
    const badEffect = { parts, fits: { pistol: { ranks: {}, quirk: null, effect: 'plasma' } } };
    expect(parseServerPacket(frame({ players: [{ ...player, gear: badEffect }] }))).toBeNull();
    expect(parseServerPacket(frame({ players: [{ ...player, gear: { ...older, kits: { acid: 1 } } }] }))).toBeNull();
  });

  it('takes the new bench commands and nothing like them', () => {
    expect(isBenchAction({ kind: 'fit_effect', weapon: 'pistol', effect: 'acid' })).toBe(true);
    expect(isBenchAction({ kind: 'move_effect', from: 'pistol', to: 'carbine' })).toBe(true);
    expect(isBenchAction({ kind: 'fit_effect', weapon: 'pistol', effect: 'plasma' })).toBe(false);
    expect(isBenchAction({ kind: 'fit_effect', weapon: 'bazooka', effect: 'acid' })).toBe(false);
    expect(isBenchAction({ kind: 'move_effect', from: 'pistol' })).toBe(false);
    const packet = parseClientPacket(JSON.stringify({ type: 'bench', action: { kind: 'fit_effect', weapon: 'shotgun', effect: 'tranq' } }));
    expect(packet).toEqual({ type: 'bench', action: { kind: 'fit_effect', weapon: 'shotgun', effect: 'tranq' } });
    expect(parseClientPacket(JSON.stringify({ type: 'bench', action: { kind: 'move_effect', from: 'nope', to: 'pistol' } }))).toBeNull();
  });
});
