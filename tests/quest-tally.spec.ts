import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../shared/protocol.ts';
import { QuestTally } from '../src/game/home/quest-tally.ts';

const ME = 'p1';
const THEM = 'p2';
const spot = { x: 0, y: 0 };

const die = (zombieId: string, killerId: string | null, zombieType: 'walker' | 'brute' = 'walker'): GameEvent =>
  ({ type: 'zombie_die', zombieId, zombieType, ...spot, angle: 0, killerId, points: 10 });
const flame = (zombieId: string): GameEvent => ({ type: 'zombie_status', effect: 'incendiary', zombieId, zombieType: 'walker', ...spot });

describe('the trip tally', () => {
  it('counts only the local player\'s own kills, by kind', () => {
    const tally = new QuestTally();
    tally.observe([die('a', ME), die('b', THEM), die('c', ME, 'brute'), die('d', null)], ME);
    const seen = tally.snapshot();
    expect(seen.counts.kills).toBe(2);
    expect(seen.killsBy).toMatchObject({ walker: 1, brute: 1 });
  });

  it('counts a kill as burning only when this zombie was set alight first', () => {
    const tally = new QuestTally();
    tally.observe([flame('a'), die('a', ME), die('b', ME)], ME);
    expect(tally.snapshot().counts.burning).toBe(1);
  });

  it('does not credit a burning kill to someone else, and forgets the flame', () => {
    const tally = new QuestTally();
    tally.observe([flame('a'), die('a', THEM)], ME);
    tally.observe([die('a', ME)], ME);
    expect(tally.snapshot().counts.burning).toBe(0);
  });

  it('counts headshots, landed shoves, searches, bottles, medkits, damage, suppressed shots and bandages', () => {
    const tally = new QuestTally();
    tally.observe([
      { type: 'headshot', playerId: ME, zombieId: 'a', zombieType: 'walker', ...spot, angle: 0, points: 5 },
      { type: 'headshot', playerId: THEM, zombieId: 'b', zombieType: 'walker', ...spot, angle: 0, points: 5 },
      { type: 'melee', playerId: ME, ...spot, angle: 0, hit: true },
      { type: 'melee', playerId: ME, ...spot, angle: 0, hit: false },
      { type: 'container_opened', playerId: ME, container: 1, ...spot, found: true, noisy: true },
      { type: 'container_opened', playerId: ME, container: 2, ...spot, found: false, noisy: false },
      { type: 'bottle_smash', playerId: ME, ...spot, fromX: 0, fromY: 0 },
      { type: 'heal', playerId: ME, ...spot, amount: 40 },
      { type: 'player_hurt', playerId: ME, ...spot, damage: 12 },
      { type: 'player_hurt', playerId: THEM, ...spot, damage: 99 },
      { type: 'shot', playerId: ME, weapon: 'pistol', ...spot, angle: 0, suppressed: true },
      { type: 'shot', playerId: ME, weapon: 'pistol', ...spot, angle: 0 },
      { type: 'pickup', playerId: ME, pickup: 'bandage', ...spot },
      { type: 'pickup', playerId: ME, pickup: 'medkit', ...spot },
    ], ME);
    expect(tally.snapshot().counts).toEqual({
      kills: 0, headshots: 1, shoves: 1, finds: 1, noisy: 1, bottles: 1, medkits: 1, damage: 12, suppressed: 1, burning: 0, bandages: 1,
    });
  });

  it('resets, and a snapshot taken earlier does not change', () => {
    const tally = new QuestTally();
    tally.observe([die('a', ME)], ME);
    const before = tally.snapshot();
    tally.observe([die('b', ME)], ME);
    expect(before.counts.kills).toBe(1);
    tally.reset();
    expect(tally.snapshot().counts.kills).toBe(0);
  });

  it('keeps the party size at one or more and the survivor it was told', () => {
    const tally = new QuestTally();
    tally.setContext(0, 'rex');
    expect(tally.snapshot()).toMatchObject({ party: 1, survivor: 'rex' });
    tally.setContext(3.9, null);
    expect(tally.snapshot()).toMatchObject({ party: 3, survivor: null });
  });
});
