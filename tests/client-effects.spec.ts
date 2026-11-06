import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { noParts } from '../shared/gun-upgrades.ts';
import type { GunFit, PlayerGear } from '../shared/gun-upgrades.ts';
import type { BulletEntity, ZombieEntity } from '../shared/protocol.ts';
import { KIT_ORDER } from '../shared/round-effect-data.ts';
import type { GunEffect } from '../shared/round-effect-data.ts';
import { noKits } from '../shared/round-effects.ts';
import { effectLabel, effectView, kitsOf, needsConfirm, replaceQuestion } from '../src/game/bench-effects.ts';
import { burstFor } from '../src/engine/status-bursts.ts';
import { beginStatusFrame, MAX_FLAMES, paintBurn, paintEffectTrail, paintTint } from '../src/engine/status-fx.ts';

const gear = (over: Partial<PlayerGear> = {}): PlayerGear => ({ parts: noParts(), fits: {}, ...over });
const OWNED = ['pistol', 'carbine'] as const;
const fitWith = (effect: GunEffect): GunFit => ({ ranks: {}, quirk: null, effect });

describe('the bench rows for a gun effect', () => {
  it('lists every kit with its count and offers no replace on a plain gun', () => {
    const view = effectView('pistol', OWNED, gear({ kits: { ...noKits(), acid: 2 } }));
    expect(view.current).toBeNull();
    expect(view.options.map((o) => o.effect)).toEqual(['incendiary', 'acid', 'piercing', 'tranq']);
    const acid = view.options.find((o) => o.effect === 'acid');
    expect(acid).toMatchObject({ count: 2, fittable: true, replaces: null });
    expect(view.options.filter((o) => o.fittable)).toHaveLength(1);
  });

  it('treats a gear block with no kits as none', () => {
    expect(kitsOf(gear())).toEqual(noKits());
    expect(effectView('pistol', OWNED, gear()).options.every((o) => !o.fittable)).toBe(true);
  });

  it('names what a kit would replace, and refuses a kit of what the gun already fires', () => {
    const g = gear({ kits: { ...noKits(), acid: 1, tranq: 1 }, fits: { pistol: fitWith('acid') } });
    const view = effectView('pistol', OWNED, g);
    const tranq = view.options.find((o) => o.effect === 'tranq')!;
    expect(tranq.replaces).toBe('Acid rounds');
    expect(needsConfirm(tranq)).toBe(true);
    expect(replaceQuestion(tranq)).toBe('Replace Acid rounds with Tranq rounds? The old rounds are lost.');
    expect(view.options.find((o) => o.effect === 'acid')?.fittable).toBe(false);
    expect(effectLabel(g.fits.pistol)).toBe('Acid rounds');
    expect(effectLabel(undefined)).toBeNull();
  });

  it('offers a move only with a toolkit and a gun that has no effect', () => {
    const fits = { pistol: fitWith('incendiary') };
    const noTool = effectView('pistol', OWNED, gear({ fits }));
    expect(noTool.moves).toEqual([]);
    const parts = { ...noParts(), toolkit: 1 };
    expect(effectView('pistol', OWNED, gear({ fits, parts })).moves).toEqual(['carbine']);
    const busy = { ...fits, carbine: fitWith('acid') };
    expect(effectView('pistol', OWNED, gear({ fits: busy, parts })).moves).toEqual([]);
  });

  it('has a kit icon key for each effect', () => {
    expect(KIT_ORDER).toHaveLength(4);
  });
});

/** Counts what a context is asked to draw. */
function recorder() {
  const calls = { fillRect: 0, drawImage: 0 };
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    fillRect: () => { calls.fillRect += 1; },
    drawImage: () => { calls.drawImage += 1; },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const zombie = (id: string, over: Partial<ZombieEntity> = {}): ZombieEntity =>
  ({ id, type: 'walker', x: 0, y: 0, angle: 0, health: 10, maxHealth: 10, attacking: false, ...over });

describe('status drawing', () => {
  beforeEach(() => {
    const canvas = () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        createRadialGradient: () => ({ addColorStop: () => undefined }),
        fillRect: () => undefined,
        drawImage: () => undefined,
        set fillStyle(_v: unknown) {},
        set globalCompositeOperation(_v: unknown) {},
      }),
    });
    vi.stubGlobal('document', { createElement: canvas });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('draws nothing for a clean zombie', () => {
    const { ctx, calls } = recorder();
    beginStatusFrame();
    paintBurn(ctx, zombie('z1'), 10, 10, 24, 1, false);
    expect(calls).toEqual({ fillRect: 0, drawImage: 0 });
  });

  it('caps pixel flames per frame however many bodies burn', () => {
    const { ctx, calls } = recorder();
    beginStatusFrame();
    for (let i = 0; i < MAX_FLAMES * 3; i += 1) paintBurn(ctx, zombie(`z${i}`, { burning: true }), 10, 10, 24, 1, false);
    const rectsPerFlame = 9;
    expect(calls.fillRect).toBe(MAX_FLAMES * rectsPerFlame);
    expect(calls.drawImage).toBeLessThanOrEqual(40);
    beginStatusFrame();
    const again = recorder();
    paintBurn(again.ctx, zombie('z0', { burning: true }), 10, 10, 24, 1, false);
    expect(again.calls.fillRect).toBe(rectsPerFlame);
  });

  it('holds still under reduced motion', () => {
    const shape = (time: number): number[] => {
      const rects: number[] = [];
      const ctx = { globalAlpha: 1, globalCompositeOperation: '', fillStyle: '', drawImage: () => undefined, fillRect: (...a: number[]) => rects.push(...a) };
      beginStatusFrame();
      paintBurn(ctx as unknown as CanvasRenderingContext2D, zombie('z9', { burning: true }), 5, 5, 20, time, true);
      return rects;
    };
    expect(shape(0.1)).toEqual(shape(7.3));
  });

  it('leaves clean zombies untinted and a plain round untrailed', () => {
    const { ctx, calls } = recorder();
    const sprite = { w: 4, h: 4, ax: 2, ay: 4, rgba: new Uint8ClampedArray(64) };
    paintTint(ctx, zombie('z1'), sprite, 5, 5, 1, false);
    const plain: BulletEntity = { id: 'b', shooterId: 'p', x: 0, y: 0, vx: 100, vy: 0 };
    paintEffectTrail(ctx, plain, 0, 0);
    expect(calls).toEqual({ fillRect: 0, drawImage: 0 });
  });

  it('trails an effect round, longer for piercing', () => {
    const count = (effect: BulletEntity['effect']): number => {
      const { ctx, calls } = recorder();
      paintEffectTrail(ctx, { id: 'b', shooterId: 'p', x: 0, y: 0, vx: 100, vy: 0, effect }, 0, 0);
      return calls.fillRect;
    };
    expect(count('incendiary')).toBeGreaterThan(0);
    expect(count('piercing')).toBeGreaterThan(count('acid'));
  });

  it('puts out fewer sparks for a fire that caught', () => {
    const event = { type: 'zombie_status', effect: 'incendiary', zombieId: 'z', zombieType: 'walker', x: 0, y: 0 } as const;
    expect(burstFor({ ...event, caught: true }).count).toBeLessThan(burstFor(event).count);
  });
});
