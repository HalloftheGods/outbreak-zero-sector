import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { BASELINE_DIFFICULTY } from '../shared/difficulty.ts';
import type { Loadout, TripReceipt } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import { FINAL_LEVEL } from '../shared/levels.ts';
import { NO_HOME_ACTIONS } from '../src/game/home-hud.ts';
import type { HomeUi } from '../src/game/home-hud.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import {
  aimsCursor,
  closeLocker,
  deathSummary,
  forgeView,
  garageLevels,
  leaveWarning,
  lockerView,
  moveToHands,
  moveToLocker,
  setupLevelLines,
} from '../src/game/home-screens.ts';
import { picksStyle, setupStyle } from '../src/game/play-flow.ts';
import { recordRows, recordStats, TITLE_MENU } from '../src/game/title-menu.ts';

function homeUi(patch: Partial<HomeUi> = {}): HomeUi {
  return {
    inBunker: true,
    station: null,
    stationHold: 0,
    shop: null,
    ready: false,
    carried: { silver: 0, jewels: { small: 0, large: 0 } },
    pickedLevel: null,
    roomHighest: 1,
    overrun: null,
    highest: 1,
    difficulty: BASELINE_DIFFICULTY,
    receipt: null,
    save: null,
    forgeProgress: 0,
    saveError: null,
    death: null,
    ...patch,
  };
}

function gear(patch: Partial<Loadout> = {}): Loadout {
  return { ...emptyLoadout(), ...patch };
}

describe('the locker', () => {
  it('the locker shows both sides and closing it calls equip', () => {
    const save = emptySave(1);
    save.locker = gear({ guns: { pistol: {}, carbine: {} }, medkits: 2, ammoBag: { pistol: 24, carbine: 0, shotgun: 0 } });
    save.hands = gear({ guns: { shotgun: {} }, bottles: 3 });

    const view = lockerView(save);
    expect(view.locker.map((row) => row.key)).toEqual(['gun:pistol', 'gun:carbine', 'ammo:pistol', 'medkit']);
    expect(view.hands.map((row) => row.key)).toEqual(['gun:shotgun', 'bottle']);

    const equip = vi.fn();
    closeLocker(save, { ...NO_HOME_ACTIONS, equip });
    expect(equip).toHaveBeenCalledWith(save.hands);
  });

  it('moves a whole gun or a count between the sides, and refuses what is not there', () => {
    const locker = gear({ guns: { pistol: {} }, medkits: 2 });
    const hands = gear();
    const moved = moveToHands({ locker, hands }, 'medkit');
    expect(moved.locker.medkits).toBe(1);
    expect(moved.hands.medkits).toBe(1);

    const gunMoved = moveToHands(moved, 'gun:pistol');
    expect(gunMoved.locker.guns.pistol).toBeUndefined();
    expect(gunMoved.hands.guns.pistol).toEqual({});

    const back = moveToLocker(gunMoved, 'gun:pistol');
    expect(back.locker.guns.pistol).toEqual({});
    expect(moveToHands({ locker: gear(), hands }, 'medkit')).toEqual({ locker: gear(), hands });
    expect(locker.medkits).toBe(2);
  });

  it('a tile keeps room for its name: Take and Stow sit on their own row under it', () => {
    const strip = readFileSync(new URL('../src/components/LockerShelf.vue', import.meta.url), 'utf8');
    const moves = strip.match(/<span class="strip-moves">[\s\S]*?<\/span>\s*<\/div>/)?.[0] ?? '';
    expect(moves).toContain(`@click="emit('take', tile.key)"`);
    expect(moves).toContain(`@click="emit('stow', tile.key)"`);
    expect(strip).toMatch(/\.strip-name\s*{[^}]*text-overflow:\s*ellipsis/);
  });
});

describe('the forge', () => {
  it('the forge shows per-jewel progress', () => {
    const save = emptySave(1);
    save.rawJewels = { small: 2, large: 1 };
    const view = forgeView(homeUi({ save, forgeProgress: 0.5 }));
    expect(view.waiting).toEqual({ small: 2, large: 1 });
    expect(view.progress).toBe(0.5);
    expect(view.secondsLeft).toBe(7.5);
    expect(view.idle).toBe(false);
  });

  it('is idle with no jewels, and with no save yet', () => {
    expect(forgeView(homeUi({ save: emptySave(1) })).idle).toBe(true);
    expect(forgeView(homeUi()).idle).toBe(true);
  });
});

describe('the garage map', () => {
  it("the garage map caps at the room's highest and marks replays", () => {
    const levels = garageLevels(homeUi({ roomHighest: 3, pickedLevel: 2 }));
    expect(levels).toHaveLength(FINAL_LEVEL);
    expect(levels.slice(0, 4).map((level) => level.state)).toEqual(['replay', 'replay', 'frontier', 'locked']);
    expect(levels.filter((level) => level.picked).map((level) => level.number)).toEqual([2]);
    expect(levels[3].selectable).toBe(false);
    expect(levels[0].selectable).toBe(true);
  });
});

describe('the death summary', () => {
  it('the death summary lists what was lost', () => {
    const receipt = {
      outcome: 'died',
      level: 4,
      silver: 120,
      jewels: { small: 2, large: 1 },
    } as TripReceipt;
    const lost = gear({ guns: { shotgun: {} }, medkits: 1, bottles: 2, knife: true });
    const lines = deathSummary({ receipt, lost });
    expect(lines).toEqual(['120 silver', '2 small jewels', '1 large jewel', 'Shotgun', '1 medkit', '2 bottles', 'Knife']);
  });

  it('says nothing was lost when nothing was', () => {
    const receipt = { outcome: 'died', level: 1, silver: 0, jewels: { small: 0, large: 0 } } as TripReceipt;
    expect(deathSummary({ receipt, lost: gear() })).toEqual(['Nothing was lost']);
  });
});

describe('leaving mid-trip', () => {
  it('the pause menu warns before leaving mid-trip', () => {
    const warning = leaveWarning(homeUi({ inBunker: false }));
    expect(warning).toMatch(/counts as dying/);
  });

  it('does not warn in the bunker', () => {
    expect(leaveWarning(homeUi({ inBunker: true }))).toBeNull();
    expect(leaveWarning(null)).toBeNull();
  });
});

describe('the cursor', () => {
  it('the cursor shows while a shop is open', () => {
    const open = homeUi({ station: 'gunsmith', shop: 'gunsmith' });
    expect(aimsCursor({ screen: 'game', paused: false, mapOpen: false, bench: false, home: open })).toBe(false);
    expect(aimsCursor({ screen: 'game', paused: false, mapOpen: false, bench: false, home: homeUi() })).toBe(true);
    expect(aimsCursor({ screen: 'game', paused: false, mapOpen: false, bench: false, home: null })).toBe(true);
  });

  it('the cursor shows while the death summary is up', () => {
    const lost = { receipt: { outcome: 'died' }, lost: gear() } as unknown as HomeUi['death'];
    const dead = homeUi({ death: lost });
    expect(aimsCursor({ screen: 'game', paused: false, mapOpen: false, bench: false, home: dead })).toBe(false);
  });
});

describe('records by style', () => {
  const best = { score: 900, wave: 6, kills: 80, durationSec: 300 };

  it('tells a best run from a best trip', () => {
    expect(recordStats(best)[0].tag).toBe('Best score');
    expect(recordStats(best, 'arcade')[0].tag).toBe('Best score');
    expect(recordStats(best, 'campaign')[0].tag).toBe('Best trip score');
  });

  it('marks each row on the board with the style it came from', () => {
    const trip = { callsign: 'A', score: 5, timestamp: 1, trip: true } as Parameters<typeof recordRows>[0][number];
    const run = { callsign: 'B', score: 4, timestamp: 2 } as Parameters<typeof recordRows>[0][number];
    expect(recordRows([trip, run]).map((row) => row.style)).toEqual(['campaign', 'arcade']);
  });
});

describe('setup page', () => {
  it('hides the level choice in Campaign, where the co-op note no longer says level 1', () => {
    const home = setupLevelLines({ style: 'campaign', multi: true, level: 3, unlocked: true, chosen: 3 });
    expect(home.startLine).toBeNull();
    expect(home.coopNote).not.toMatch(/level 1/i);
    expect(setupLevelLines({ style: 'campaign', multi: false, level: 3, unlocked: true, chosen: 3 }).coopNote).toBeNull();
    const arcade = setupLevelLines({ style: 'arcade', multi: true, level: 3, unlocked: true, chosen: 3 });
    expect(arcade.coopNote).toMatch(/level 1/);
    expect(setupLevelLines({ style: 'arcade', multi: false, level: 2, unlocked: true, chosen: 2 }).startLine).toMatch(/Start at level 2/);
  });

  it('claims no style for a room that decides: no level hint, and a neutral co-op line that names neither style', () => {
    const joining = setupLevelLines({ style: null, multi: true, level: null, unlocked: false, chosen: null });
    expect(joining.startLine).toBeNull();
    expect(joining.coopNote).toMatch(/room decides/i);
    expect(joining.coopNote).not.toMatch(/level|garage|map/i);
    expect(setupLevelLines({ style: null, multi: false, level: null, unlocked: false, chosen: null })).toEqual({ startLine: null, coopNote: null });
  });

  it('always keeps the Levels page on the title: it is Arcade\'s', () => {
    expect(TITLE_MENU.some((item) => item.page === 'levels')).toBe(true);
  });

  it('a picked level means Arcade, and an invite or a level leaves no style to pick', () => {
    expect(setupStyle(null, 'campaign')).toBe('campaign');
    expect(setupStyle(null, 'arcade')).toBe('arcade');
    expect(setupStyle(3, 'campaign')).toBe('arcade');
    expect(setupStyle(1, 'campaign')).toBe('arcade');
    expect(picksStyle(false, null)).toBe(true);
    expect(picksStyle(true, null)).toBe(false);
    expect(picksStyle(false, 2)).toBe(false);
  });
});
