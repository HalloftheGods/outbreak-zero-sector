import { describe, expect, it } from 'vitest';
import { CHEST_STATION } from '../shared/bunker-map.ts';
import { AMMO_PICKUPS, TICK_RATE, WEAPONS } from '../shared/constants.ts';
import { rollFind } from '../shared/container-loot.ts';
import { scaleRounds } from '../shared/difficulty.ts';
import { emptyLoadout, mergeHome } from '../shared/loadout.ts';
import { CHEST_STACK_MAX, CHEST_STACK_MIN, openChest, OVERRUN_CHEST_JEWEL_FROM, rollChest } from '../shared/overrun-chest.ts';
import { overrunHolds } from '../shared/overrun-fight.ts';
import { OVERRUN_CHEST_STACKS } from '../shared/overrun.ts';
import { isAmmoPickup } from '../shared/pickups.ts';
import type { PlayerState, SimState } from '../shared/sim-state.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { driveToTown } from './helpers/home-harness.ts';
import { playerNamed } from './helpers/home-harness.ts';
import { input, SEED, stateOf, steps } from './helpers/sim-harness.ts';

function heldRoom(players: readonly string[] = ['a'], highest = 2): { sim: GameSimulation; state: SimState } {
  const sim = new GameSimulation({ seed: SEED, overrun: true, home: true });
  for (const id of players) sim.addPlayer(id, id, null, undefined, { loadout: emptyLoadout(), highest });
  sim.snapshot();
  const state = stateOf(sim);
  overrunHolds(state, state.overrun as NonNullable<SimState['overrun']>);
  return { sim, state };
}

const homeOf = (p: PlayerState): NonNullable<PlayerState['home']> => p.home as NonNullable<PlayerState['home']>;

function holdAtChest(sim: GameSimulation, id: string, p: PlayerState, seq: number): void {
  p.x = CHEST_STATION.x;
  p.y = CHEST_STATION.y;
  sim.setInput(id, input({ seq, search: true }));
  steps(sim, TICK_RATE);
  sim.setInput(id, input({ seq: seq + 1 }));
  sim.step();
}

describe('the chest roll', () => {
  it('draws only from the police table, as whole boxes, a medkit and six silver stacks', () => {
    const { state } = heldRoom();
    const mirror = heldRoom().state;
    const roll = rollChest(state, 2);
    let rounds = 0;
    for (let i = 0; i < 3; i += 1) {
      const { type } = rollFind(mirror, 'police');
      expect(isAmmoPickup(type)).toBe(true);
      if (isAmmoPickup(type)) rounds += scaleRounds(AMMO_PICKUPS[type].rounds, state.difficulty);
    }
    const bag = roll.gear.ammoBag;
    expect(bag.pistol + bag.carbine + bag.shotgun).toBe(rounds);
    expect(roll.gear.medkits).toBe(1);
    expect(roll.silver).toBeGreaterThanOrEqual(OVERRUN_CHEST_STACKS * CHEST_STACK_MIN);
    expect(roll.silver).toBeLessThanOrEqual(OVERRUN_CHEST_STACKS * CHEST_STACK_MAX);
  });

  it('is the same roll from the same seed and a different one after it', () => {
    const one = rollChest(heldRoom().state, 2);
    const two = rollChest(heldRoom().state, 2);
    expect(two).toEqual(one);
    const { state } = heldRoom();
    const first = rollChest(state, 2);
    expect(rollChest(state, 2)).not.toEqual(first);
  });

  it('adds one small jewel from level 5 up, and none below', () => {
    const { state } = heldRoom();
    expect(rollChest(state, OVERRUN_CHEST_JEWEL_FROM - 1).jewels).toEqual({ small: 0, large: 0 });
    expect(rollChest(state, OVERRUN_CHEST_JEWEL_FROM).jewels).toEqual({ small: 1, large: 0 });
  });

  it('credits ammo for a gun the player does not own, and the locker caps it', () => {
    const chest = emptyLoadout();
    chest.ammoBag.carbine = 45;
    const locker = emptyLoadout();
    locker.ammoBag.carbine = WEAPONS.carbine.reserveCap - 5;
    expect(mergeHome(locker, chest).ammoBag.carbine).toBe(WEAPONS.carbine.reserveCap);
    expect(mergeHome(emptyLoadout(), chest).ammoBag.carbine).toBe(45);
  });
});

describe('the chest in the room', () => {
  it('opens by holding E at the chest, writes one held receipt, and is then gone', () => {
    const { sim, state } = heldRoom();
    const me = playerNamed(state, 'a');
    expect(homeOf(me).chest).toBe(true);
    holdAtChest(sim, 'a', me, 1);
    const receipt = homeOf(me).overrun;
    expect(receipt).toMatchObject({ outcome: 'held', share: 0, lost: null });
    expect(receipt?.chest?.medkits).toBe(1);
    expect(homeOf(me).chest).toBe(false);
    holdAtChest(sim, 'a', me, 3);
    expect(homeOf(me).overrun).toBe(receipt);
    openChest(state, me);
    expect(homeOf(me).overrun).toBe(receipt);
    expect(homeOf(me).station).toBeNull();
  });

  it('gives two co-op players separate chests and separate rolls', () => {
    const { sim, state } = heldRoom(['a', 'b']);
    const a = playerNamed(state, 'a');
    const b = playerNamed(state, 'b');
    holdAtChest(sim, 'a', a, 1);
    expect(homeOf(b).overrun).toBeNull();
    expect(homeOf(b).chest).toBe(true);
    holdAtChest(sim, 'b', b, 1);
    const [one, two] = [homeOf(a).overrun, homeOf(b).overrun];
    expect(one?.outcome).toBe('held');
    expect(two?.outcome).toBe('held');
    expect(one?.serial).not.toBe(two?.serial);
    expect([one?.chest, one?.silver]).not.toEqual([two?.chest, two?.silver]);
  });

  it('writes the receipt when the van leaves with the chest unopened', () => {
    const { sim, state } = heldRoom();
    const me = playerNamed(state, 'a');
    expect(homeOf(me).overrun).toBeNull();
    driveToTown(sim, state);
    expect(state.homeRun?.tripLevel).toBe(1);
    expect(homeOf(me).overrun).toMatchObject({ outcome: 'held', silver: expect.any(Number) });
    expect(homeOf(me).chest).toBe(false);
  });
});
