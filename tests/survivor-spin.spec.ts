import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSurvivors } from '../src/art/survivors.ts';
import { createSpinner, FRONT_FACING, holdsStill, SPIN_ORDER, SPIN_STEP_MS } from '../src/game/survivor-spin.ts';
import type { SpinTimers } from '../src/game/survivor-spin.ts';

function fakeTimers() {
  let tick: (() => void) | null = null;
  let interval = 0;
  const timers: SpinTimers = {
    set: (run, ms) => {
      tick = run;
      interval = ms;
      return 1 as unknown as ReturnType<typeof setInterval>;
    },
    clear: () => {
      tick = null;
    },
  };
  return { timers, fire: () => tick?.(), live: () => tick !== null, interval: () => interval };
}

describe('survivor spin', () => {
  it('still turns for a mouse under reduced motion, and holds a touch screen still', () => {
    expect(holdsStill(false, true)).toBe(false);
    expect(holdsStill(true, true)).toBe(true);
    expect(holdsStill(true, false)).toBe(false);
  });

  it('turns through all eight facings in order, one step each, and loops', () => {
    const shown: number[] = [];
    const clock = fakeTimers();
    createSpinner((facing) => shown.push(facing), clock.timers).start();
    for (let step = 1; step < SPIN_ORDER.length + 1; step++) clock.fire();
    expect(clock.interval()).toBe(SPIN_STEP_MS);
    expect(shown.slice(0, 8)).toEqual(SPIN_ORDER);
    expect(new Set(shown.slice(0, 8)).size).toBe(8);
    expect(shown[8]).toBe(SPIN_ORDER[0]);
  });

  it('returns to the front and clears the timer on stop', () => {
    const shown: number[] = [];
    const clock = fakeTimers();
    const spinner = createSpinner((facing) => shown.push(facing), clock.timers);
    spinner.start();
    clock.fire();
    spinner.stop();
    expect(clock.live()).toBe(false);
    expect(shown.at(-1)).toBe(FRONT_FACING);
  });

  it('starts from the front again when restarted, with one timer', () => {
    const shown: number[] = [];
    const clock = fakeTimers();
    const spinner = createSpinner((facing) => shown.push(facing), clock.timers);
    spinner.start();
    clock.fire();
    clock.fire();
    spinner.start();
    expect(shown.at(-1)).toBe(SPIN_ORDER[0]);
  });
});

describe('survivor spin on the real timers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('calls the global timers on the global scope, as a browser demands', async () => {
    const calls: string[] = [];
    // A browser throws Illegal invocation when these run as a method of another object.
    function onGlobalScope(self: unknown, name: string): void {
      const onGlobal = self === undefined || self === globalThis;
      if (!onGlobal) throw new TypeError(`Illegal invocation: ${name}`);
      calls.push(name);
    }
    vi.stubGlobal('setInterval', function (this: unknown) {
      onGlobalScope(this, 'setInterval');
      return 7;
    });
    vi.stubGlobal('clearInterval', function (this: unknown) {
      onGlobalScope(this, 'clearInterval');
    });
    vi.resetModules();
    const fresh = await import('../src/game/survivor-spin.ts');
    const spinner = fresh.createSpinner(() => undefined);
    spinner.start();
    spinner.stop();
    expect(calls).toEqual(['setInterval', 'clearInterval']);
  });
});

describe('survivor portraits', () => {
  const art = buildSurvivors();

  it('gives each survivor eight frames at the portrait crop, with the portrait in front', () => {
    for (const survivor of art) {
      expect(survivor.portraits).toHaveLength(8);
      for (const frame of survivor.portraits) {
        expect(`${frame.w}x${frame.h}`).toBe(`${survivor.portrait.w}x${survivor.portrait.h}`);
      }
      expect(survivor.portraits[FRONT_FACING]).toEqual(survivor.portrait);
    }
  });

  it('shows a different picture for most facings', () => {
    for (const survivor of art) {
      const looks = new Set(survivor.portraits.map((frame) => Array.from(frame.rgba).join(',')));
      expect(looks.size).toBeGreaterThanOrEqual(5);
    }
  });
});
