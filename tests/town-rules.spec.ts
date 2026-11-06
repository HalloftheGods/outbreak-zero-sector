import { describe, expect, it } from 'vitest';
import { LEVELS } from '../shared/levels.ts';
import { playerSpeed } from '../shared/players.ts';
import {
  BLACKOUT_HEARING_SCALE,
  FLOOD_SPEED_SCALE,
  groundSpeedScale,
  TOWN_RULES,
  townRule,
  TRACK_EVERY_TICKS,
  TRACK_LIFE_SEC,
} from '../shared/town-rules.ts';
import { makeNoise, spottedFrom } from '../shared/zombie-senses.ts';
import { circleHitsSolid, segmentHitsSolid } from '../shared/world-query.ts';
import { levelTitle } from '../src/game/level-hud.ts';
import { addRoamer, findBuilding, input, quietSim, steps } from './helpers/sim-harness.ts';
import { buildingBox } from '../shared/world-map.ts';
import { TICK_RATE } from '../shared/constants.ts';

const levelOf = (theme: string): number => LEVELS.find((level) => level.theme === theme)!.number;

function simAt(level: number) {
  const quiet = quietSim();
  quiet.state.level = level;
  return quiet;
}

describe('town rules', () => {
  it('every rule belongs to a theme some level plays', () => {
    for (const theme of Object.keys(TOWN_RULES)) expect(LEVELS.some((level) => level.theme === theme)).toBe(true);
    expect(townRule(1)).toBeNull();
  });

  it('the level card names the rule only where there is one', () => {
    expect(levelTitle(1).rule).toBeUndefined();
    expect(levelTitle(levelOf('flooded')).rule).toContain('Floodwater');
  });

  it('floodwater slows walking outdoors and not indoors', () => {
    const { sim, state } = simAt(levelOf('flooded'));
    const [p] = state.players;
    expect(groundSpeedScale(state.level, state.map, p.x, p.y)).toBe(FLOOD_SPEED_SCALE);
    const box = buildingBox(findBuilding(sim, 'house'));
    expect(groundSpeedScale(state.level, state.map, (box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2)).toBe(1);
    expect(groundSpeedScale(1, state.map, p.x, p.y)).toBe(1);

    const startX = p.x;
    sim.setInput('a', input({ seq: 1, right: true }));
    steps(sim, 3);
    expect(p.x - startX).toBeCloseTo((playerSpeed(p.skin) * FLOOD_SPEED_SCALE * 3) / TICK_RATE, 1);
  });

  it('a blackout carries noise further', () => {
    const radius = 100;
    const reach = radius * BLACKOUT_HEARING_SCALE;
    const heardAt = (level: number) => {
      const { state } = simAt(level);
      const [p] = state.players;
      const roamer = addRoamer(state, 'walker', p.x + (radius + reach) / 2, p.y);
      makeNoise(state, p.x, p.y, radius);
      return roamer.mode;
    };
    expect(heardAt(1)).toBe('wander');
    expect(heardAt(levelOf('blackout'))).toBe('alert');
  });

  it('a blackout hides a survivor a zombie would see on a lit night', () => {
    const seen = (level: number) => {
      const { sim, state } = simAt(level);
      const [p] = state.players;
      const distance = spottedFrom(p) * 0.85;
      const clear = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
        .map((angle) => ({ x: p.x + Math.cos(angle) * distance, y: p.y + Math.sin(angle) * distance }))
        .find((spot) => !segmentHitsSolid(state.map, p.x, p.y, spot.x, spot.y) && !circleHitsSolid(state.map, spot.x, spot.y, 8))!;
      const roamer = addRoamer(state, 'walker', clear.x, clear.y);
      steps(sim, 7);
      return roamer.mode;
    };
    const lit = seen(1);
    const dark = seen(levelOf('blackout'));
    expect(lit).toBe('hunt');
    expect(dark).not.toBe('hunt');
  });

  describe('fresh snow', () => {
    it('walking outdoors leaves prints that fill in, sneaking leaves none', () => {
      const walked = simAt(levelOf('snow'));
      walked.sim.setInput('a', input({ seq: 1, right: true }));
      steps(walked.sim, TRACK_EVERY_TICKS * 3);
      expect(walked.state.tracks.length).toBeGreaterThan(0);
      walked.sim.setInput('a', input({ seq: 2 }));
      steps(walked.sim, Math.ceil(TRACK_LIFE_SEC * TICK_RATE) + 1);
      expect(walked.state.tracks).toEqual([]);

      const crept = simAt(levelOf('snow'));
      crept.sim.setInput('a', input({ seq: 1, right: true, sneak: true }));
      steps(crept.sim, TRACK_EVERY_TICKS * 3);
      expect(crept.state.tracks).toEqual([]);
    });

    it('no prints outside a snowy town', () => {
      const { sim, state } = simAt(1);
      sim.setInput('a', input({ seq: 1, right: true }));
      steps(sim, TRACK_EVERY_TICKS * 3);
      expect(state.tracks).toEqual([]);
    });

    it('a roamer that crosses a print picks up the trail', () => {
      const { sim, state } = simAt(levelOf('snow'));
      const [p] = state.players;
      // Far enough off to be out of sight, standing right on an old print.
      state.tracks.push({ x: p.x + 400, y: p.y, by: p.id, left: TRACK_LIFE_SEC });
      const roamer = addRoamer(state, 'walker', p.x + 400, p.y);
      steps(sim, 7);
      expect(roamer.mode).toBe('alert');
    });
  });
});
