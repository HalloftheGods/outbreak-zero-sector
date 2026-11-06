import { describe, expect, it } from 'vitest';
import { BOTTLE_CARRY } from '../shared/bottles.ts';
import { MEDKIT_MAX, START_SPARE_ROUNDS, WEAPONS } from '../shared/constants.ts';
import { PART_CARRY_CAP } from '../shared/gun-upgrade-data.ts';
import type { GunFit } from '../shared/gun-upgrades.ts';
import type { Loadout } from '../shared/home-protocol.ts';
import { applyLoadout, emptyLoadout, issueFreePistol, loadoutOf, loadoutOfEntity, mergeHome, validateLoadout } from '../shared/loadout.ts';
import { KIT_CARRY_CAP } from '../shared/round-effect-data.ts';
import { homeSim } from './helpers/home-harness.ts';

const ONE_RANK: GunFit = { ranks: { damage: 1 }, quirk: null };
const TWO_RANKS: GunFit = { ranks: { damage: 1, fireRate: 1 }, quirk: null };

const loadout = (overrides: Partial<Loadout> = {}): Loadout => ({ ...emptyLoadout(), ...overrides });
const rounds = (pistol: number, carbine = 0, shotgun = 0): Loadout['ammoBag'] => ({ pistol, carbine, shotgun });

describe('a loadout on a player', () => {
  it('takes out what the loadout holds and nothing else', () => {
    const p = homeSim().state.players[0];
    applyLoadout(p, loadout({ guns: { carbine: { fit: ONE_RANK } }, ammoBag: rounds(5, 40), medkits: 2, knife: true, bottles: 3 }));
    expect(p.owned).toEqual(['carbine']);
    expect(p.weapon).toBe('carbine');
    expect(p.guns.carbine?.fit).toEqual(ONE_RANK);
    expect(p).toMatchObject({ medkits: 2, knife: true, bottles: 3 });
  });

  it('loads each gun from its own rounds, so it reads back the same', () => {
    const p = homeSim().state.players[0];
    const gear = loadout({ guns: { carbine: {} }, ammoBag: rounds(5, 40) });
    applyLoadout(p, gear);
    expect(p.guns.carbine?.ammo).toBe(WEAPONS.carbine.magSize);
    expect(p.ammoBag).toEqual(rounds(5, 40 - WEAPONS.carbine.magSize));
    expect(p).toMatchObject({ ammo: WEAPONS.carbine.magSize, reserve: 40 - WEAPONS.carbine.magSize, magSize: WEAPONS.carbine.magSize });
    expect(loadoutOf(p)).toEqual(gear);
  });

  it('leaves a player with no gun empty-handed', () => {
    const p = homeSim().state.players[0];
    applyLoadout(p, emptyLoadout());
    expect(p.guns).toEqual({});
    expect(p.owned).toEqual([]);
    expect(p).toMatchObject({ ammo: 0, magSize: 0, reserve: 0, bottles: 0 });
    expect(loadoutOf(p)).toEqual(emptyLoadout());
  });

  it('counts a magazine as rounds, up to the reserve cap', () => {
    const p = homeSim().state.players[0];
    p.guns = { pistol: { ammo: 10 } };
    p.ammoBag = rounds(WEAPONS.pistol.reserveCap - 4);
    expect(loadoutOf(p).ammoBag.pistol).toBe(WEAPONS.pistol.reserveCap);
    p.ammoBag = rounds(20);
    expect(loadoutOf(p).ammoBag.pistol).toBe(30);
  });

  it('hands back copies, so a later change to the player cannot reach a receipt', () => {
    const p = homeSim().state.players[0];
    const gear = loadoutOf(p);
    p.parts.barrel = 3;
    p.kits.acid = 1;
    p.ammoBag.pistol = 0;
    expect(gear.parts.barrel).toBe(0);
    expect(gear.kits.acid).toBe(0);
    expect(gear.ammoBag.pistol).toBeGreaterThan(0);
  });
});

describe('a loadout on an entity', () => {
  it('loadoutOfEntity reads the same gear as loadoutOf', () => {
    const { sim, state } = homeSim();
    const p = state.players[0];
    applyLoadout(p, loadout({
      guns: { pistol: {}, carbine: { fit: { ...TWO_RANKS, effect: 'acid' } } },
      ammoBag: rounds(30, 50, 6),
      parts: { barrel: 1, grip: 0, magazine: 2, suppressor: 0, toolkit: 1 },
      kits: { incendiary: 1, acid: 0, piercing: 2, tranq: 0 },
      medkits: 1,
      knife: true,
      bottles: 2,
    }));
    const [entity] = sim.snapshot().players;
    expect(loadoutOfEntity(entity)).toEqual(loadoutOf(p));
  });

  it('reads what the wire leaves off as none', () => {
    const { sim, state } = homeSim();
    applyLoadout(state.players[0], loadout({ guns: { pistol: {} }, ammoBag: rounds(3) }));
    const [entity] = sim.snapshot().players;
    expect(entity).not.toHaveProperty('gear');
    expect(entity).not.toHaveProperty('bottles');
    expect(loadoutOfEntity(entity)).toEqual(loadout({ guns: { pistol: {} }, ammoBag: rounds(3) }));
  });
});

describe('the free pistol', () => {
  it('the free pistol adds a gun and starting rounds up to the cap, no bottle, and keeps other gear', () => {
    const p = homeSim().state.players[0];
    applyLoadout(p, loadout({ ammoBag: rounds(WEAPONS.pistol.reserveCap - 5, 9), medkits: 2, knife: true }));
    issueFreePistol(p);
    expect(p.owned).toEqual(['pistol']);
    expect(p.weapon).toBe('pistol');
    expect(p.guns.pistol?.ammo).toBe(WEAPONS.pistol.magSize);
    expect(p.ammoBag).toEqual(rounds(WEAPONS.pistol.reserveCap, 9));
    expect(p).toMatchObject({ medkits: 2, knife: true, bottles: 0, ammo: WEAPONS.pistol.magSize, reserve: WEAPONS.pistol.reserveCap });
  });

  it('gives an empty-handed player the rounds a new game starts with', () => {
    const p = homeSim().state.players[0];
    applyLoadout(p, emptyLoadout());
    issueFreePistol(p);
    expect(p.ammoBag.pistol).toBe(START_SPARE_ROUNDS);
  });

  it('is not for anyone already holding a gun', () => {
    const p = homeSim().state.players[0];
    const gear = loadout({ guns: { shotgun: {} }, ammoBag: rounds(0, 0, 3) });
    applyLoadout(p, gear);
    issueFreePistol(p);
    expect(loadoutOf(p)).toEqual(gear);
  });
});

describe('what comes home to the locker', () => {
  it('adds what came home to what stayed', () => {
    const locker = loadout({ guns: { pistol: {} }, ammoBag: rounds(10), medkits: 1 });
    const gear = loadout({ guns: { carbine: { fit: ONE_RANK } }, ammoBag: rounds(5, 20), medkits: 1, knife: true, bottles: 1 });
    expect(mergeHome(locker, gear)).toEqual(loadout({
      guns: { pistol: {}, carbine: { fit: ONE_RANK } },
      ammoBag: rounds(15, 20),
      medkits: 2,
      knife: true,
      bottles: 1,
    }));
  });

  it('a second copy of a gun keeps the one with more mods and returns the other\'s parts', () => {
    const plain = loadout({ guns: { pistol: { fit: ONE_RANK } } });
    const worked = loadout({ guns: { pistol: { fit: { ranks: { damage: 1, reload: 1 }, quirk: null } } } });
    const merged = mergeHome(plain, worked);
    expect(merged.guns.pistol?.fit).toEqual(worked.guns.pistol?.fit);
    expect(merged.parts).toMatchObject({ barrel: 1, grip: 0, magazine: 0 });
    const otherWay = mergeHome(worked, plain);
    expect(otherWay.guns.pistol?.fit).toEqual(worked.guns.pistol?.fit);
    expect(otherWay.parts).toEqual(merged.parts);
  });

  it('pays every rank of a stripped gun back in full', () => {
    const stripped = loadout({ guns: { pistol: { fit: { ranks: { reload: 2 }, quirk: null } } } });
    const kept = loadout({ guns: { pistol: { fit: { ranks: { damage: 2, fireRate: 1 }, quirk: null } } } });
    expect(mergeHome(kept, stripped).parts).toMatchObject({ grip: 2, magazine: 2 });
  });

  it('keeps the locker\'s copy when the two are level, and counts an effect as a mod', () => {
    const stored = loadout({ guns: { pistol: { fit: ONE_RANK } } });
    const level = loadout({ guns: { pistol: { fit: { ranks: { fireRate: 1 }, quirk: null } } } });
    expect(mergeHome(stored, level).guns.pistol?.fit).toEqual(ONE_RANK);
    const withEffect: GunFit = { ranks: { fireRate: 1 }, quirk: null, effect: 'piercing' };
    expect(mergeHome(stored, loadout({ guns: { pistol: { fit: withEffect } } })).guns.pistol?.fit).toEqual(withEffect);
  });

  it('gives back the kit from a stripped gun\'s effect', () => {
    const stored = loadout({ guns: { pistol: { fit: { ranks: {}, quirk: null, effect: 'tranq' } } } });
    const better = loadout({ guns: { pistol: { fit: TWO_RANKS } } });
    expect(mergeHome(stored, better).kits.tranq).toBe(1);
  });

  it('mergeHome keeps the locker to the carry caps', () => {
    const full = loadout({
      ammoBag: rounds(WEAPONS.pistol.reserveCap, WEAPONS.carbine.reserveCap - 1, WEAPONS.shotgun.reserveCap),
      parts: { barrel: PART_CARRY_CAP, grip: PART_CARRY_CAP, magazine: PART_CARRY_CAP, suppressor: PART_CARRY_CAP, toolkit: PART_CARRY_CAP },
      kits: { incendiary: KIT_CARRY_CAP, acid: KIT_CARRY_CAP, piercing: KIT_CARRY_CAP, tranq: KIT_CARRY_CAP },
      medkits: MEDKIT_MAX,
      knife: true,
      bottles: BOTTLE_CARRY,
    });
    const merged = mergeHome(full, full);
    expect(merged).toEqual({ ...full, ammoBag: rounds(WEAPONS.pistol.reserveCap, WEAPONS.carbine.reserveCap, WEAPONS.shotgun.reserveCap) });
  });

  it('holds parts from a stripped gun to the cap too', () => {
    const stored = loadout({ guns: { pistol: { fit: TWO_RANKS } }, parts: { barrel: PART_CARRY_CAP, grip: 0, magazine: 0, suppressor: 0, toolkit: 0 } });
    const plain = loadout({ guns: { pistol: { fit: ONE_RANK } } });
    expect(mergeHome(stored, plain).parts.barrel).toBe(PART_CARRY_CAP);
  });

  it('leaves both sides as they were', () => {
    const locker = loadout({ guns: { pistol: { fit: ONE_RANK } }, ammoBag: rounds(10) });
    const gear = loadout({ guns: { pistol: { fit: TWO_RANKS } }, ammoBag: rounds(10) });
    const before = JSON.stringify([locker, gear]);
    mergeHome(locker, gear);
    expect(JSON.stringify([locker, gear])).toBe(before);
  });
});

describe('a loadout from the wire', () => {
  const legal = (): Loadout => loadout({
    guns: { pistol: {}, carbine: { fit: { ranks: { damage: 2, fireRate: 2 }, quirk: 'hot_loads', effect: 'acid' } } },
    ammoBag: rounds(WEAPONS.pistol.reserveCap, 10, 0),
    parts: { barrel: PART_CARRY_CAP, grip: 0, magazine: 0, suppressor: 0, toolkit: 0 },
    kits: { incendiary: 0, acid: KIT_CARRY_CAP, piercing: 0, tranq: 0 },
    medkits: MEDKIT_MAX,
    knife: true,
    bottles: BOTTLE_CARRY,
  });

  /** A legal loadout with one thing wrong with it, as it would arrive parsed from JSON. */
  const tampered = (change: (gear: Record<string, any>) => void): unknown => {
    const gear = JSON.parse(JSON.stringify(legal()));
    change(gear);
    return gear;
  };

  it('accepts anything inside the slots and caps', () => {
    expect(validateLoadout(legal())).toEqual(legal());
    expect(validateLoadout(emptyLoadout())).toEqual(emptyLoadout());
  });

  it('accepts a rank left at zero by a moved upgrade', () => {
    const gear = loadout({ guns: { pistol: { fit: { ranks: { damage: 0 }, quirk: null } } } });
    expect(validateLoadout(gear)).toEqual(gear);
  });

  it('hands back a copy holding nothing but the loadout', () => {
    const gear = tampered((value) => {
      value.extra = true;
    });
    expect(validateLoadout(gear)).toEqual(legal());
  });

  const refused: readonly (readonly [string, (gear: Record<string, any>) => void])[] = [
    ['an unknown gun', (gear) => { gear.guns.railgun = {}; }],
    ['an unknown upgrade', (gear) => { gear.guns.pistol.fit = { ranks: { lasers: 1 }, quirk: null }; }],
    ['an unknown quirk', (gear) => { gear.guns.pistol.fit = { ranks: {}, quirk: 'cursed' }; }],
    ['an unknown effect', (gear) => { gear.guns.pistol.fit = { ranks: {}, quirk: null, effect: 'plasma' }; }],
    ['an unknown part', (gear) => { gear.parts.flux = 1; }],
    ['an unknown kit', (gear) => { gear.kits.plasma = 1; }],
    ['rounds for an unknown gun', (gear) => { gear.ammoBag.railgun = 1; }],
    ['too many ranks of one upgrade', (gear) => { gear.guns.pistol.fit = { ranks: { damage: 4 }, quirk: null }; }],
    ['more ranks than the gun has slots', (gear) => { gear.guns.pistol.fit = { ranks: { damage: 2, fireRate: 2 }, quirk: null }; }],
    ['rounds over the reserve cap', (gear) => { gear.ammoBag.pistol = WEAPONS.pistol.reserveCap + 1; }],
    ['parts over the carry cap', (gear) => { gear.parts.barrel = PART_CARRY_CAP + 1; }],
    ['kits over the carry cap', (gear) => { gear.kits.acid = KIT_CARRY_CAP + 1; }],
    ['medkits over the cap', (gear) => { gear.medkits = MEDKIT_MAX + 1; }],
    ['bottles over the cap', (gear) => { gear.bottles = BOTTLE_CARRY + 1; }],
    ['a negative count', (gear) => { gear.ammoBag.carbine = -1; }],
    ['half a medkit', (gear) => { gear.medkits = 0.5; }],
    ['a count that is not a number', (gear) => { gear.bottles = 'lots'; }],
    ['a knife that is not a flag', (gear) => { gear.knife = 1; }],
    ['a missing section', (gear) => { delete gear.parts; }],
    ['a gun that is not a record', (gear) => { gear.guns.pistol = 1; }],
  ];

  for (const [name, change] of refused) {
    it(`refuses ${name}`, () => {
      expect(validateLoadout(tampered(change))).toBeNull();
    });
  }

  it('validateLoadout refuses unknown ids and anything over a slot or cap', () => {
    expect(refused.every(([, change]) => validateLoadout(tampered(change)) === null)).toBe(true);
    for (const value of [null, undefined, 7, 'pistol', []]) expect(validateLoadout(value)).toBeNull();
  });
});
