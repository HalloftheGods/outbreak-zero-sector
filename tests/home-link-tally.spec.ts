import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TICK_RATE } from '../shared/constants.ts';
import type { MerchantId } from '../shared/home-protocol.ts';
import type { GameEvent, SnapshotPacket } from '../shared/protocol.ts';
import { HomeLink } from '../src/game/home-link.ts';
import type { HomeLinkHost } from '../src/game/home-link.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import type { UiState } from '../src/game/hud-state.ts';
import { ME, frame, receipt, sharedStore } from './helpers/home-sync-frames.ts';

const headshot = (zombieId: string): GameEvent => ({ type: 'headshot', playerId: ME, zombieId, zombieType: 'walker', x: 0, y: 0, angle: 0, points: 5 });
const withEvents = (snapshot: SnapshotPacket, events: GameEvent[]): SnapshotPacket => ({ ...snapshot, events });
const withActive = (merchant: MerchantId, id: string): HomeSave => {
  const save = emptySave(7);
  return { ...save, quests: { ...save.quests, active: { [merchant]: { id, progress: 0, acceptedAt: 0 } } } };
};

function hostOf(): HomeLinkHost {
  return {
    transport: () => null,
    ui: () => ({ callsign: 'ANA' }) as UiState,
    localPlayer: () => null,
    refresh: vi.fn(),
    syncControls: vi.fn(),
    say: vi.fn(),
    showEnding: vi.fn(),
    hideEnding: vi.fn(),
  };
}

async function linkOver(initial: HomeSave) {
  const { slot, store } = sharedStore(initial);
  const link = new HomeLink({ store: () => store, host: hostOf() });
  await link.open('solo');
  link.welcomed({ type: 'welcome', yourId: ME, tickRate: TICK_RATE, mapSeed: 1, difficulty: 'stay_close' });
  return { link, slot };
}

const headshots = (link: HomeLink): number => link.facts().tally?.counts.headshots ?? -1;

describe('the quest tally on the home link', () => {
  beforeEach(() => {
    const kept = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => kept.get(key) ?? null,
      setItem: (key: string, value: string) => void kept.set(key, value),
      removeItem: (key: string) => void kept.delete(key),
    });
  });

  it('counts what the local player does, and keeps the count through being downed', async () => {
    const { link } = await linkOver(emptySave(7));
    link.observe(withEvents(frame({ tick: 100 }), [headshot('a'), headshot('b')]), ME, 0);
    expect(headshots(link)).toBe(2);
    link.observe(withEvents(frame({ tick: 101, player: { status: 'downed' } }), [headshot('c')]), ME, 0);
    expect(headshots(link)).toBe(3);
  });

  it('clears the count when the local player dies, and only once', async () => {
    const { link } = await linkOver(emptySave(7));
    link.observe(withEvents(frame({ tick: 100 }), [headshot('a'), headshot('b')]), ME, 0);
    link.observe(frame({ tick: 101, player: { status: 'dead' } }), ME, 0);
    expect(headshots(link)).toBe(0);
    link.observe(withEvents(frame({ tick: 102, player: { status: 'dead' } }), [headshot('c')]), ME, 0);
    expect(headshots(link)).toBe(1);
  });

  it('hands the save the count it had, then clears it once the receipt lands', async () => {
    const { link, slot } = await linkOver(withActive('gunsmith', 'headhunter'));
    const shots = Array.from({ length: 15 }, (_, n) => headshot(`z${n}`));
    link.observe(withEvents(frame({ tick: 100 }), shots), ME, 0);
    expect(headshots(link)).toBe(15);
    link.observe(frame({ tick: 101, home: { receipt: receipt({ level: 2 }) } }), ME, 0);
    await vi.waitFor(() => expect(slot.save.appliedReceipts).toHaveLength(1));
    await vi.waitFor(() => expect(headshots(link)).toBe(0));
    expect(slot.save.quests.active.gunsmith?.progress).toBe(15);
  });

  it('clears the count after a died receipt, which credits nothing', async () => {
    const { link, slot } = await linkOver(withActive('gunsmith', 'headhunter'));
    link.observe(withEvents(frame({ tick: 100 }), [headshot('a')]), ME, 0);
    link.observe(frame({ tick: 101, home: { receipt: receipt({ outcome: 'died', level: 2 }) } }), ME, 0);
    await vi.waitFor(() => expect(slot.save.appliedReceipts).toHaveLength(1));
    await vi.waitFor(() => expect(headshots(link)).toBe(0));
    expect(slot.save.quests.active.gunsmith?.progress).toBe(0);
  });
});
