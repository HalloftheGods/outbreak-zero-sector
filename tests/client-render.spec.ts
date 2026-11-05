import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TICK_DT } from '../shared/constants.ts';
import { generateWorldMap } from '../shared/world-map.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { buildArtBook } from '../src/art/index.ts';
import { bodyHeight, clipFrame, clipFrameAt, strideFrame } from '../src/engine/sprite-cache.ts';
import { OverlayRenderer } from '../src/engine/overlay-renderer.ts';
import { EMPTY_SCENE } from '../src/engine/scene.ts';
import type { VisualStore } from '../src/engine/visuals.ts';
import { WorldRenderer } from '../src/engine/world-renderer.ts';
import { ClientWorld } from '../src/game/client-world.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';

const SEED = 4242;

describe('clip timing', () => {
  const sprite = (w: number) => ({ w, h: 1, ax: 0, ay: 0, rgba: new Uint8ClampedArray(w * 4) });
  const frames = [sprite(1), sprite(2), sprite(3)];

  it('wraps a looping clip', () => {
    const clip = { frames, fps: 10, loop: true };
    expect(clipFrame(clip, 0.05)).toBe(frames[0]);
    expect(clipFrame(clip, 0.35)).toBe(frames[0]);
  });

  it('holds the last frame of a one-shot', () => {
    const clip = { frames, fps: 10, loop: false };
    expect(clipFrame(clip, 99)).toBe(frames[2]);
  });

  it('maps progress across the clip without running off the end', () => {
    const clip = { frames, fps: 10, loop: false };
    expect(clipFrameAt(clip, 0)).toBe(frames[0]);
    expect(clipFrameAt(clip, 0.5)).toBe(frames[1]);
    expect(clipFrameAt(clip, 1)).toBe(frames[2]);
  });

  it('steps by distance walked', () => {
    const clip = { frames, fps: 10, loop: true };
    expect(strideFrame(clip, 3, 6)).toBe(frames[0]);
    expect(strideFrame(clip, 7, 6)).toBe(frames[1]);
    expect(strideFrame(clip, 19, 6)).toBe(frames[0]);
  });

  it('measures a figure from its feet to its first painted row', () => {
    const rgba = new Uint8ClampedArray(4 * 4 * 4);
    rgba[(1 * 4 + 2) * 4 + 3] = 255;
    expect(bodyHeight({ w: 4, h: 4, ax: 2, ay: 3, rgba })).toBe(2);
  });
});

describe('zombie health bars', () => {
  const BLOOD = '#c8332a';
  const hurt = { id: 'z1', type: 'walker', x: 50, y: 50, angle: 0, health: 10, maxHealth: 60, attacking: false } as const;

  function barsDrawn(isKilled: (id: string) => boolean): number {
    let bars = 0;
    const ctx = {
      fillStyle: '',
      fillRect() {
        const isBar = this.fillStyle === BLOOD;
        if (isBar) bars += 1;
      },
    };
    const visuals = { get: () => ({ sprite: null }) } as unknown as VisualStore;
    const overlay = new OverlayRenderer(buildArtBook(), visuals);
    const scene = { ...EMPTY_SCENE, zombies: [hurt] };
    overlay.draw(ctx as unknown as CanvasRenderingContext2D, scene, 0, 0, 200, 200, 0, () => 255, isKilled);
    return bars;
  }

  beforeEach(() => {
    installFakeBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws one over a hurt zombie', () => {
    expect(barsDrawn(() => false)).toBe(1);
  });

  it('leaves the bar off a zombie whose corpse is already down', () => {
    expect(barsDrawn((id) => id === hurt.id)).toBe(0);
  });
});

describe('render pipeline', () => {
  beforeEach(() => {
    installFakeBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws a whole fight with real art and a real sim, on whole pixels throughout', () => {
    const art = buildArtBook();
    const renderer = new WorldRenderer(fakeCanvas() as unknown as HTMLCanvasElement, art, false);
    const map = generateWorldMap(SEED);
    renderer.setMap(map);

    const sim = new GameSimulation({ seed: SEED });
    sim.addPlayer('me', 'ANA');
    sim.addPlayer('mate', 'BEN');
    const world = new ClientWorld(map, 'me');
    const seenEvents = new Set<string>();
    let drawn = 0;

    for (let tick = 0; tick < 30 * 60; tick += 1) {
      const angle = tick * 0.05;
      sim.setInput('me', {
        seq: tick + 1,
        up: false,
        down: false,
        left: tick % 120 < 60,
        right: tick % 120 >= 60,
        angle,
        shoot: true,
        reload: tick % 90 === 0,
        weapon: null,
        melee: tick % 40 === 0,
        heal: false,
        search: false,
      });
      sim.step();
      const snapshot = sim.snapshot();
      const now = tick * TICK_DT * 1000;
      for (const event of snapshot.events) {
        seenEvents.add(event.type);
        renderer.handleEvent(event, { localId: 'me', localX: world.predictor.x, localY: world.predictor.y });
      }
      world.push(snapshot, now);
      const entities = world.advance(now + 16, 66, 1, 0, angle, TICK_DT);
      if (!entities) continue;
      renderer.render({ ...EMPTY_SCENE, ...entities, pointerX: 300, pointerY: 100, showCrosshair: true }, TICK_DT);
      drawn += 1;
    }

    expect(drawn).toBeGreaterThan(1000);
    expect(seenEvents).toContain('shot');
    expect(seenEvents).toContain('melee');
  }, 60_000);

  it('survives a resize and a map change mid-flight', () => {
    const art = buildArtBook();
    const renderer = new WorldRenderer(fakeCanvas() as unknown as HTMLCanvasElement, art, true);
    renderer.setMap(generateWorldMap(1));
    renderer.render({ ...EMPTY_SCENE, focusX: 400, focusY: 400 }, 1 / 60);
    window.innerWidth = 800;
    window.innerHeight = 500;
    renderer.resize();
    renderer.setMap(generateWorldMap(2));
    renderer.render({ ...EMPTY_SCENE, focusX: 100, focusY: 100 }, 1 / 60);
    expect(renderer.camera.viewW).toBeLessThan(480);
  });
});
