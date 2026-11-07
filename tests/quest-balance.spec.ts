import { describe, expect, it } from 'vitest';
import { containerLoot } from '../shared/container-loot.ts';
import { DIFFICULTIES } from '../shared/difficulty.ts';
import type { MerchantId } from '../shared/home-protocol.ts';
import { ammoKillShare } from '../shared/loot.ts';
import type { PickupType } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { townWorth } from '../shared/treasure.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { MERCHANTS, itemOf } from '../src/game/home/merchant-data.ts';
import { JOB_BANDS, QUESTS, jobTimes, targetOf } from '../src/game/home/quest-data.ts';
import { rollJobs } from '../src/game/home/quest-state.ts';
import { accept, silverOf, turnIn } from '../src/game/home/quests.ts';
import type { QuestContext } from '../src/game/home/quests.ts';
import { boxRounds } from '../src/game/home/shop.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';

const BOUGHT_SHARE_LIMIT = 0.15;
const TRIPS = 20;

type Rounds = { type: PickupType; rounds: number };

/** Every ammo box a one-time quest can ever pay, as pickups on a floor. */
function questAmmo(difficulty: QuestContext['difficulty']): Rounds[] {
  return QUESTS.flatMap((def) =>
    def.reward.flatMap((reward) => {
      if (reward.kind !== 'item') return [];
      const item = itemOf(reward.merchant, reward.item);
      if (!item || item.grant.kind !== 'ammo') return [];
      const rounds = boxRounds(item, difficulty);
      return Array.from({ length: reward.count }, () => ({ type: item.grant.kind === 'ammo' ? item.grant.ammo : 'pistol_ammo', rounds }));
    }),
  );
}

/** What Sarge's full shelf is worth in killing power, as pickups on a floor. */
function fullShelf(difficulty: QuestContext['difficulty']): Rounds[] {
  return MERCHANTS.quartermaster.items.flatMap((item) =>
    item.grant.kind === 'ammo' && item.stock.kind === 'fixed'
      ? Array.from({ length: item.stock.count }, () => ({ type: item.grant.kind === 'ammo' ? item.grant.ammo : 'pistol_ammo', rounds: boxRounds(item, difficulty) }))
      : [],
  );
}

describe('quest balance', () => {
  it('quest ammo plus bought ammo stays under 15% of the town budget at every difficulty', () => {
    const ratios: number[] = [];
    for (const { id } of DIFFICULTIES) {
      const state = stateOf(new GameSimulation({ seed: SEED, difficulty: id }));
      const town = ammoKillShare([...state.pickups, ...containerLoot(state)]);
      const quest = ammoKillShare(questAmmo(id));
      const bought = ammoKillShare(fullShelf(id));
      const ratio = (quest + bought) / town;
      console.info(`${id}: quest ${quest.toFixed(3)} + bought ${bought.toFixed(3)} of the population, town ${town.toFixed(3)}, ratio ${ratio.toFixed(3)}`);
      ratios.push(ratio);
    }
    expect(Math.max(...ratios)).toBeLessThan(BOUGHT_SHARE_LIMIT);
  }, 60000);

  it('jobs grant silver only, never an item', () => {
    const jobs = QUESTS.filter((def) => def.repeat === 'job');
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(job.reward).toEqual([]);
      expect(job.jobSilver).toBeGreaterThan(0);
    }
  });

  it(`job soak: a bot finishes every offered job over ${TRIPS} trips and reports quest silver per trip`, () => {
    const merchants = Object.keys(MERCHANTS) as MerchantId[];
    const base = emptySave(11);
    let save: HomeSave = { ...base, quests: { ...base.quests, active: {} } };
    const perTrip: number[] = [];
    const income = Math.round(townWorth(1, false) / 3);
    for (let trip = 1; trip <= TRIPS; trip++) {
      const highest = Math.min(10, 1 + Math.floor(trip / 2));
      const before = save.silver;
      save = { ...save, quests: rollJobs(save.quests, highest) };
      for (const merchant of merchants) {
        const context: QuestContext = { station: merchant, highest, difficulty: 'lights_out', now: trip };
        const id = save.quests.jobs[merchant];
        if (!id) continue;
        const taken = accept(save, merchant, id, context);
        expect(taken).not.toBeNull();
        const def = QUESTS.find((each) => each.id === id)!;
        const ready: HomeSave = { ...taken!, quests: { ...taken!.quests, active: { ...taken!.quests.active, [merchant]: { id, progress: targetOf(def.objective), acceptedAt: trip } } } };
        const paid = turnIn(ready, merchant, context);
        expect(paid).not.toBeNull();
        expect(paid!.silver - ready.silver).toBe(silverOf(def, highest));
        expect(paid!.locker).toEqual(ready.locker);
        save = paid!;
      }
      perTrip.push(save.silver - before);
    }
    const bands = JOB_BANDS.map((band) => `<=${band.upTo}: x${band.times}`).join(', ');
    console.info(`job soak (bands ${bands}): quest silver per trip ${perTrip.join(' ')}; total ${save.silver}; a third of a level 1 town is ${income} per trip`);
    // One of each stall's job is on offer every trip, so a full set is 140 silver at level 1-3, 210 at 4-6 and 280 at 7-10.
    expect(perTrip[0]).toBe(140);
    expect(perTrip[TRIPS - 1]).toBe(280);
    expect(perTrip.every((silver) => silver > 0)).toBe(true);
    expect(jobTimes(10)).toBeGreaterThanOrEqual(jobTimes(1));
    // Jobs are a top-up: at the top band a full set of four never beats a whole level 1 town's jewels.
    expect(Math.max(...perTrip)).toBeLessThan(townWorth(1, false));
  });
});