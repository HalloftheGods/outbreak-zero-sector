import { describe, expect, it } from 'vitest';
import { characterOf } from '../shared/characters.ts';
import { SPRINT_DRAIN_SEC, SPRINT_REARM_SHARE, STAMINA_REGEN_DELAY_SEC, STAMINA_REGEN_SEC, TICK_RATE } from '../shared/constants.ts';
import { playerSnapshot } from '../shared/snapshot-build.ts';
import { input, quietSim, steps } from './helpers/sim-harness.ts';

const BANDUS = 1;
const QUEEN = 2;

function sprinter(skin = BANDUS) {
  const { sim, state } = quietSim();
  const [p] = state.players;
  p.skin = skin;
  p.x = 40;
  return { sim, state, p };
}

describe('sprint stamina', () => {
  it('a rested survivor starts full', () => {
    const { p } = sprinter();
    expect(p.stamina).toBe(1);
    expect(p.winded).toBe(false);
  });

  it('sprinting drains the bar, and standing still with sprint held does not', () => {
    const { sim, p } = sprinter();
    sim.setInput('a', input({ seq: 1, sprint: true }));
    steps(sim, TICK_RATE);
    expect(p.stamina).toBe(1);
    sim.setInput('a', input({ seq: 2, right: true, sprint: true }));
    steps(sim, TICK_RATE);
    expect(p.stamina).toBeCloseTo(1 - 1 / (SPRINT_DRAIN_SEC * characterOf(BANDUS).moveSpeed), 1);
  });

  it('runs dry, then walks and cannot sprint until the bar refills enough', () => {
    const { sim, p } = sprinter();
    sim.setInput('a', input({ seq: 1, right: true, sprint: true }));
    steps(sim, Math.ceil(TICK_RATE * (SPRINT_DRAIN_SEC + 0.5)));
    expect(p.stamina).toBe(0);
    expect(p.winded).toBe(true);
    expect(p.stance).toBe('walk');
    steps(sim, 2);
    expect(p.stance).toBe('walk');
  });

  it('a winded survivor travels at walking pace', () => {
    const walked = (extra: { sprint?: boolean }, winded: boolean) => {
      const { sim, p } = sprinter();
      p.stamina = winded ? 0 : 1;
      p.winded = winded;
      const startX = p.x;
      sim.setInput('a', input({ seq: 1, right: true, ...extra }));
      steps(sim, 3);
      return p.x - startX;
    };
    expect(walked({ sprint: true }, true)).toBeCloseTo(walked({}, false));
    expect(walked({ sprint: true }, false)).toBeGreaterThan(walked({}, false));
  });

  it('recovers after a short rest, and sprints again once past the re-arm mark', () => {
    const { sim, p } = sprinter();
    p.stamina = 0;
    p.winded = true;
    sim.setInput('a', input({ seq: 1, right: true, sprint: true }));
    steps(sim, Math.ceil(TICK_RATE * (STAMINA_REGEN_DELAY_SEC + STAMINA_REGEN_SEC * SPRINT_REARM_SHARE)) + 2);
    expect(p.winded).toBe(false);
    steps(sim, 1);
    expect(p.stance).toBe('sprint');
  });

  it('walking refills the bar', () => {
    const { sim, p } = sprinter();
    p.stamina = 0.2;
    sim.setInput('a', input({ seq: 1, right: true }));
    steps(sim, TICK_RATE * (STAMINA_REGEN_SEC + 1));
    expect(p.stamina).toBe(1);
  });

  it('a faster survivor sprints longer', () => {
    const drained = (skin: number) => {
      const { sim, p } = sprinter(skin);
      sim.setInput('a', input({ seq: 1, right: true, sprint: true }));
      steps(sim, TICK_RATE * 2);
      return 1 - p.stamina;
    };
    expect(characterOf(QUEEN).moveSpeed).toBeGreaterThan(characterOf(BANDUS).moveSpeed);
    expect(drained(QUEEN)).toBeLessThan(drained(BANDUS));
  });

  it('the snapshot only carries stamina when it is not full', () => {
    const { p } = sprinter();
    expect(playerSnapshot(p).stamina).toBeUndefined();
    p.stamina = 0.4;
    expect(playerSnapshot(p).stamina).toBe(0.4);
    expect(playerSnapshot(p).winded).toBeUndefined();
    p.winded = true;
    expect(playerSnapshot(p).winded).toBe(true);
  });
});
