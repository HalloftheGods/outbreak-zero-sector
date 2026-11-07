import { describe, expect, it } from 'vitest';
import { playerSnapshot } from '../shared/snapshot-build.ts';
import { staminaBar } from '../src/engine/overlay-renderer.ts';
import { quietSim } from './helpers/sim-harness.ts';

function survivor(stamina: number, winded = false) {
  const { state } = quietSim();
  const [p] = state.players;
  p.stamina = stamina;
  p.winded = winded;
  return playerSnapshot(p);
}

describe('the sprint bar under the player', () => {
  it('is hidden while the bar is full', () => {
    expect(staminaBar(survivor(1), true, 0)).toBeNull();
  });

  it('shows how much is left, in amber, for the local survivor', () => {
    const bar = staminaBar(survivor(0.4), true, 0);
    expect(bar?.fraction).toBe(0.4);
    expect(bar?.color).toBe('#e8a33d');
  });

  it('is not drawn under a teammate', () => {
    expect(staminaBar(survivor(0.4), false, 0)).toBeNull();
  });

  it('is not drawn once down', () => {
    const { state } = quietSim();
    const [p] = state.players;
    p.stamina = 0.4;
    p.status = 'downed';
    expect(staminaBar(playerSnapshot(p), true, 0)).toBeNull();
  });

  it('blinks red while winded', () => {
    const colors = new Set([0, 0.1, 0.2, 0.3].map((time) => staminaBar(survivor(0, true), true, time)?.color));
    expect(colors.has('#c8332a')).toBe(true);
    expect(colors.size).toBe(2);
  });
});
