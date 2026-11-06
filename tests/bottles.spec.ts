import { describe, expect, it } from 'vitest';
import { parseClientPacket } from '../server/packets.ts';
import {
  BOTTLE_CARRY,
  BOTTLE_NOISE_RADIUS,
  BOTTLE_RANGE,
  CAR_ALARM_RADIUS,
  landingSpot,
  maybeCarAlarm,
  scroungeBottle,
  START_BOTTLES,
} from '../shared/bottles.ts';
import { townContainers } from '../shared/containers.ts';
import { segmentHitsSolid } from '../shared/world-query.ts';
import { addRoamer, eventsOf, input, quietSim, steps } from './helpers/sim-harness.ts';

const fixed = (value: number) => () => value;

describe('bottles', () => {
  it('a run starts with a bottle, and the snapshot says so', () => {
    const { sim, state } = quietSim();
    expect(state.players[0].bottles).toBe(START_BOTTLES);
    expect(sim.snapshot().players[0].bottles).toBe(START_BOTTLES);
  });

  it('a throw lands at the crosshair, uses the bottle, and draws a roamer to the smash', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const target = { x: p.x, y: p.y - 100 };
    const clear = !segmentHitsSolid(state.map, p.x, p.y, target.x, target.y);
    const aim = clear ? target : { x: p.x + 1, y: p.y };
    const roamer = addRoamer(state, 'walker', aim.x, aim.y - BOTTLE_NOISE_RADIUS + 30);
    roamer.senseOffset = 1;
    sim.setInput('a', input({ seq: 1, aimX: aim.x, aimY: aim.y, throw: true }));
    steps(sim, 1);
    expect(p.bottles).toBe(START_BOTTLES - 1);
    const [smash] = eventsOf(sim.snapshot(), 'bottle_smash');
    expect(smash.x).toBeCloseTo(aim.x, 0);
    expect(smash.y).toBeCloseTo(aim.y, 0);
    expect(roamer.mode).not.toBe('wander');
  });

  it('with no bottles, nothing happens', () => {
    const { sim, state } = quietSim();
    state.players[0].bottles = 0;
    sim.setInput('a', input({ seq: 1, throw: true }));
    steps(sim, 1);
    expect(eventsOf(sim.snapshot(), 'bottle_smash')).toEqual([]);
  });

  it('never flies past its range or through a wall', () => {
    const { state } = quietSim();
    const [p] = state.players;
    p.aim = { x: p.x + 5000, y: p.y };
    const spot = landingSpot(state, p);
    expect(Math.hypot(spot.x - p.x, spot.y - p.y)).toBeLessThanOrEqual(BOTTLE_RANGE + 0.01);
    expect(segmentHitsSolid(state.map, p.x, p.y, spot.x, spot.y)).toBeFalsy();
  });

  it('an empty search can turn one up, but not past what can be carried', () => {
    const { state } = quietSim();
    const [p] = state.players;
    const sim = { ...state, rng: fixed(0) };
    p.bottles = 0;
    expect(scroungeBottle(sim, p)).toBe(true);
    p.bottles = BOTTLE_CARRY;
    expect(scroungeBottle(sim, p)).toBe(false);
    expect(p.bottles).toBe(BOTTLE_CARRY);
  });

  it('the server keeps a throw, and turns away a non-boolean one', () => {
    const base = { seq: 1, up: false, down: false, left: false, right: false, angle: 0, shoot: false, reload: false, weapon: null, melee: false, heal: false, search: false };
    const parse = (extra: Record<string, unknown>) => parseClientPacket(JSON.stringify({ type: 'input', input: { ...base, ...extra } }));
    const thrown = parse({ throw: true });
    expect(thrown?.type === 'input' && thrown.input.throw).toBe(true);
    expect(parse({ throw: 1 })).toBeNull();
  });
});

describe('car alarms', () => {
  it('a tripped car alarm is heard far off; furniture never has one', () => {
    const { state } = quietSim();
    const containers = townContainers(state.map);
    const car = containers.find((c) => c.kind === 'car')!;
    const drawer = containers.find((c) => c.kind !== 'car')!;
    const unlucky = { ...state, rng: fixed(0), events: [] as typeof state.events };
    const roamer = addRoamer(state, 'walker', car.x + CAR_ALARM_RADIUS - 20, car.y);
    expect(maybeCarAlarm(unlucky, drawer)).toBe(false);
    expect(maybeCarAlarm(unlucky, car)).toBe(true);
    expect(unlucky.events.map((event) => event.type)).toContain('car_alarm');
    expect(roamer.mode).not.toBe('wander');
  });

  it('most cars stay quiet', () => {
    const { state } = quietSim();
    const car = townContainers(state.map).find((c) => c.kind === 'car')!;
    expect(maybeCarAlarm({ ...state, rng: fixed(0.9) }, car)).toBe(false);
  });
});
