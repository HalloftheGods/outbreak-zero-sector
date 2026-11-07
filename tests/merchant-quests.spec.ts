import { describe, expect, it, vi } from 'vitest';
import { TICK_RATE } from '../shared/constants.ts';
import type { MerchantId } from '../shared/home-protocol.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { HomeSync } from '../src/game/home/home-sync.ts';
import { emptyTally } from '../src/game/home/quest-tally.ts';
import { rosterStep } from '../src/game/character-select-view.ts';
import { abandonLabel, barRows, pickedIndex, pressAbandon, pressPrimary, primaryLabel, startTab, STALL_TABS, stateWord } from '../src/game/home/quest-screen.ts';
import { questPanels } from '../src/game/home/quest-view.ts';
import type { HomeUi } from '../src/game/home-hud.ts';
import { ME, sharedStore } from './helpers/home-sync-frames.ts';

const noQuests = (): HomeSave => {
  const save = emptySave(7);
  return { ...save, quests: { ...save.quests, active: {} } };
};
const withActive = (save: HomeSave, merchant: MerchantId, id: string, progress = 0): HomeSave => ({
  ...save,
  quests: { ...save.quests, active: { ...save.quests.active, [merchant]: { id, progress, acceptedAt: 0 } } },
});
function homeAt(save: HomeSave | null, station: MerchantId | null = 'medic'): HomeUi {
  return {
    inBunker: true, station, stationHold: 0, shop: station, ready: false,
    carried: { jewels: { small: 0, large: 0 }, worth: 0 }, pickedLevel: null, roomHighest: 1, overrun: null, highest: 10,
    difficulty: 'lights_out', receipt: null, save, forgeProgress: 0, saveError: null, death: null, chest: null, quests: { tally: emptyTally() },
  };
}
const actions = () => ({ acceptQuest: vi.fn(), turnInQuest: vi.fn(), abandonQuest: vi.fn() });

describe('the Work tab', () => {
  it('opens on Work when a job is ready, and on the shelf otherwise', () => {
    const ready = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 1)), 'medic');
    expect(ready[0].state).toBe('ready');
    expect(startTab(ready)).toBe('work');
    expect(startTab(questPanels(homeAt(noQuests()), 'medic'))).toBe('shelf');
    expect(startTab(questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 0)), 'medic'))).toBe('shelf');
    expect(startTab([])).toBe('shelf');
    expect(STALL_TABS).toEqual(['shelf', 'work']);
  });

  it('Accept, Turn in and Abandon call the home actions', () => {
    const offered = questPanels(homeAt(noQuests()), 'medic')[0];
    expect(primaryLabel(offered)).toBe('Accept');
    const a = actions();
    pressPrimary(offered, 'medic', a);
    expect(a.acceptQuest).toHaveBeenCalledWith('medic', offered.id);

    const ready = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 1)), 'medic')[0];
    expect(primaryLabel(ready)).toBe('Turn in');
    pressPrimary(ready, 'medic', a);
    expect(a.turnInQuest).toHaveBeenCalledWith('medic');

    const active = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 0)), 'medic')[0];
    expect(primaryLabel(active)).toBeNull();
    expect(pressAbandon(active, 'medic', a, true)).toBe(false);
    expect(a.abandonQuest).toHaveBeenCalledWith('medic');
  });

  it('Abandon asks twice, in the same words and place, and never for a finished quest', () => {
    const open = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 0)), 'medic')[0];
    const a = actions();
    expect(abandonLabel(false)).toBe('Abandon');
    expect(abandonLabel(true)).toBe('Confirm');
    expect(abandonLabel(true)).toHaveLength(abandonLabel(false).length);
    const armed = pressAbandon(open, 'medic', a);
    expect(armed).toBe(true);
    expect(a.abandonQuest).not.toHaveBeenCalled();
    expect(pressAbandon(open, 'medic', a, armed)).toBe(false);
    expect(a.abandonQuest).toHaveBeenCalledTimes(1);

    const ready = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 1)), 'medic')[0];
    expect(ready.canAbandon).toBe(false);
    expect(pressAbandon(ready, 'medic', a, true)).toBe(false);
    expect(a.abandonQuest).toHaveBeenCalledTimes(1);
  });

  it('presses nothing the panel says would be refused', () => {
    const away = questPanels(homeAt(noQuests(), 'gunsmith'), 'medic')[0];
    expect(away.canAct).toBe(false);
    const a = actions();
    pressPrimary(away, 'medic', a);
    expect(a.acceptQuest).not.toHaveBeenCalled();
    const waiting = questPanels(homeAt(withActive(noQuests(), 'medic', 'pharmacy_run', 0)), 'medic').find((panel) => panel.state === 'busy');
    expect(waiting && stateWord(waiting)).toBe('Waiting');
    if (waiting) pressAbandon(waiting, 'medic', a);
    expect(a.abandonQuest).not.toHaveBeenCalled();
  });

  it('keeps the pick on its quest and falls back to the first when it is gone', () => {
    const panels = questPanels(homeAt(noQuests()), 'medic');
    expect(pickedIndex(panels, panels[1].id)).toBe(1);
    expect(pickedIndex(panels, 'gone')).toBe(0);
    expect(pickedIndex([], null)).toBe(0);
    expect(barRows(panels[0].bars)[0]).toMatchObject({ label: 'Goal', filled: expect.any(Number) });
  });

  it('moves the pick along the list with the arrow keys, wrapping, as the shelf does', () => {
    const panels = questPanels(homeAt(noQuests()), 'medic');
    const last = panels.length - 1;
    expect(last).toBeGreaterThan(0);
    expect(rosterStep(0, 'ArrowRight', panels.length)).toBe(1);
    expect(rosterStep(last, 'ArrowRight', panels.length)).toBe(0);
    expect(rosterStep(0, 'ArrowLeft', panels.length)).toBe(last);
    expect(rosterStep(0, 'a', panels.length)).toBeNull();
    expect(rosterStep(0, 'ArrowRight', 0)).toBeNull();
    expect(pickedIndex(panels, panels[rosterStep(0, 'ArrowRight', panels.length) ?? 0].id)).toBe(1);
  });

  it('moves between the two tabs the same way', () => {
    expect(rosterStep(STALL_TABS.indexOf('shelf'), 'ArrowRight', STALL_TABS.length)).toBe(STALL_TABS.indexOf('work'));
    expect(rosterStep(STALL_TABS.indexOf('work'), 'ArrowRight', STALL_TABS.length)).toBe(STALL_TABS.indexOf('shelf'));
  });
});

describe('two tabs on the same save', () => {
  it('turning in the same quest pays once', async () => {
    const { slot, store } = sharedStore(withActive(noQuests(), 'medic', 'pharmacy_run', 1));
    const open = async () => {
      const sync = new HomeSync({ store, mode: 'solo', sendHome: () => {}, tally: emptyTally, highest: () => 3 });
      await sync.open();
      sync.welcomed({ type: 'welcome', yourId: ME, tickRate: TICK_RATE, mapSeed: 1, difficulty: 'stay_close' });
      await sync.settled();
      return sync;
    };
    const [one, two] = [await open(), await open()];
    const context = { station: 'medic' as const, highest: 3, difficulty: 'stay_close' as const, now: 9 };
    const first = await one.turnInQuest('medic', context);
    const second = await two.turnInQuest('medic', context);
    expect(first).toBe('saved');
    expect(second).not.toBe('saved');
    expect(slot.save.silver).toBe(60);
    expect(slot.save.quests.done.filter((id) => id === 'pharmacy_run')).toHaveLength(1);
  });
});
