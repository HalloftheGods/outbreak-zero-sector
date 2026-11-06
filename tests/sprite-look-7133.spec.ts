// #7133: survivors keep walking while they fire and reload; falls start from where the body
// was; the side-view reload shows its hand; shadows go down first and sit under zombie feet.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAYER_RADIUS } from '../shared/constants.ts';
import { playerSpeed } from '../shared/players.ts';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { PlayerEntity, PlayerStatus, ZombieEntity, ZombieType } from '../shared/protocol.ts';
import { buildArtBook } from '../src/art/index.ts';
import { inPalette } from '../src/art/palette.ts';
import { deathWith, movingFrame } from '../src/art/survivors/clips.ts';
import { FIRST_LYING_FRAME } from '../src/art/survivors/fallen.ts';
import { NIGHT } from '../src/art/survivors/night.ts';
import { bodyDrop, drawPose } from '../src/art/survivors/rig.ts';
import type { Clip, PixelSprite, SurvivorWeaponArt } from '../src/art/types.ts';
import { BuildingLayer } from '../src/engine/building-layer.ts';
import { EntityRenderer } from '../src/engine/entity-renderer.ts';
import { EMPTY_SCENE } from '../src/engine/scene.ts';
import { spriteCanvas, strideIndex } from '../src/engine/sprite-cache.ts';
import { SurvivorFrames } from '../src/engine/survivor-frames.ts';
import { VisualStore } from '../src/engine/visuals.ts';
import { installFakeBrowser } from './client-fake-dom.ts';

const art = buildArtBook();
/**
 * The feet: the rows from just above the anchor down, across the middle of the cell. A
 * reloading hand reaches row 31, and a gun held low (seen from the south-east) reaches the
 * rows below only from column 27 rightward (column 12 leftward when mirrored to the
 * south-west), so neither is inside this box.
 */
const FEET = { top: 32, left: 13, right: 26 };

function player(patch: Partial<PlayerEntity> = {}): PlayerEntity {
  return {
    id: 'me', name: 'ANA', skin: 0, x: 200, y: 200, angle: 0, moving: false, status: 'alive',
    health: 100, maxHealth: 100, weapon: 'pistol', ammo: 12, magSize: 12, reserve: 12, owned: ['pistol'],
    ammoBag: { pistol: 12, carbine: 0, shotgun: 0 }, mags: { pistol: 12, carbine: 0, shotgun: 0 }, medkits: 0, indoors: null,
    reload: 0, bleedout: 0, revive: 0, score: 0, kills: 0, lastInputSeq: 0, knife: false, search: 0, ...patch,
  };
}

function legRows(sprite: PixelSprite): string {
  const rows: string[] = [];
  for (let y = FEET.top; y < sprite.h; y += 1) {
    rows.push(sprite.rgba.subarray((y * sprite.w + FEET.left) * 4, (y * sprite.w + FEET.right + 1) * 4).join());
  }
  return rows.join('|');
}

function stridePx(skin: number, walk: Clip): number {
  return playerSpeed(skin) / walk.fps;
}

describe('firing and reloading on the move', () => {
  const frames = new SurvivorFrames(art);

  it('keeps the walk legs on every facing, weapon and stride step while firing', () => {
    for (const weapon of WEAPON_ORDER) {
      const set = art.survivors[0].weapons[weapon];
      for (let dir = 0; dir < 8; dir += 1) {
        const walk = set.walk[dir];
        expect(new Set(walk.frames.map(legRows)).size, `the walk moves its feet, dir ${dir}`).toBeGreaterThan(1);
        for (let step = 0; step < walk.frames.length; step += 1) {
          const visual = new VisualStore().get('me');
          visual.walked = (step + 0.5) * stridePx(0, walk);
          visual.fireAt = 10;
          const shown = frames.frame(player({ weapon, angle: (dir * Math.PI) / 4, moving: true }), visual, 10);
          expect(strideIndex(walk, visual.walked, stridePx(0, walk))).toBe(step);
          expect(legRows(shown), `${weapon} dir ${dir} step ${step}`).toBe(legRows(walk.frames[step]));
        }
      }
    }
  });

  it('keeps the walk legs while reloading, where the old legs stood still', () => {
    const set = art.survivors[1].weapons.carbine;
    const walk = set.walk[2];
    const legs = new Set<string>();
    for (let step = 0; step < walk.frames.length; step += 1) {
      const visual = new VisualStore().get('me');
      visual.walked = (step + 0.5) * stridePx(1, walk);
      const shown = frames.frame(player({ skin: 1, weapon: 'carbine', angle: Math.PI / 2, moving: true, reload: 0.01 }), visual, 10);
      expect(shown).toBe(movingFrame(set, 'reload', 2, 0, step));
      expect(legRows(shown)).toBe(legRows(walk.frames[step]));
      legs.add(legRows(shown));
    }
    expect(legs.size).toBeGreaterThan(1);
  });

  it('still plays the standing clip for a survivor who is not moving', () => {
    const set = art.survivors[0].weapons.shotgun;
    const visual = new VisualStore().get('me');
    visual.fireAt = 10;
    expect(frames.frame(player({ weapon: 'shotgun' }), visual, 10)).toBe(set.fire[0].frames[0]);
  });

  it('draws a moving frame once and keeps it, separately for each costume', () => {
    const own = art.survivors[0];
    const set = own.weapons.pistol;
    expect(movingFrame(set, 'fire', 4, 1, 2)).toBe(movingFrame(set, 'fire', 4, 1, 2));
    const other = own.costumes[1];
    if (other) expect(movingFrame(other.weapons.pistol, 'fire', 4, 1, 2)).not.toBe(movingFrame(set, 'fire', 4, 1, 2));
  });

  it('mirrors the west facings from the east ones', () => {
    const set = art.survivors[2].weapons.carbine;
    const east = movingFrame(set, 'reload', 0, 2, 3);
    const west = movingFrame(set, 'reload', 4, 2, 3);
    const flipped = (x: number, y: number) => west.rgba[(y * west.w + (west.w - 1 - x)) * 4 + 3];
    for (let y = 0; y < east.h; y += 1) {
      for (let x = 0; x < east.w; x += 1) expect(flipped(x, y)).toBe(east.rgba[(y * east.w + x) * 4 + 3]);
    }
  });

  it('spreads each reload over at least eight frames, so the hand travels between poses', () => {
    for (const weapon of WEAPON_ORDER) expect(art.survivors[0].weapons[weapon].reload[2].frames.length).toBeGreaterThanOrEqual(8);
  });
});

describe('falling down', () => {
  const frames = new SurvivorFrames(art);
  const set: SurvivorWeaponArt = art.survivors[0].weapons.carbine;
  const dead = deathWith(set, art.survivors[0].dead);
  const beat = 1 / dead.fps;

  function walkThrough(statuses: readonly [PlayerStatus, number][]): (time: number) => PixelSprite {
    const visual = new VisualStore().get('me');
    let last: PlayerStatus = 'alive';
    for (const [status, at] of statuses) {
      frames.track(visual, status, at);
      visual.sprite = frames.frame(player({ status, weapon: 'carbine' }), visual, at);
      last = status;
    }
    return (time) => frames.frame(player({ status: last, weapon: 'carbine' }), visual, time);
  }

  it('lies down to die where a crawling survivor bleeds out, without standing up first', () => {
    const at = walkThrough([['alive', 0], ['downed', 1], ['dead', 5]]);
    expect(at(5)).toBe(dead.frames[FIRST_LYING_FRAME]);
    expect(at(5 + 10)).toBe(dead.frames[dead.frames.length - 1]);
  });

  it('holds the last standing frame for a beat before buckling', () => {
    const visual = new VisualStore().get('me');
    frames.track(visual, 'alive', 0);
    const standing = frames.frame(player({ weapon: 'carbine' }), visual, 0);
    visual.sprite = standing;
    frames.track(visual, 'dead', 1);
    const shown = (time: number) => frames.frame(player({ status: 'dead', weapon: 'carbine' }), visual, time);
    expect(shown(1)).toBe(standing);
    expect(shown(1 + beat * 1.5)).toBe(dead.frames[1]);
  });

  it('kneels before the crawl when going down from standing', () => {
    const visual = new VisualStore().get('me');
    frames.track(visual, 'alive', 0);
    visual.sprite = frames.frame(player({ weapon: 'carbine' }), visual, 0);
    frames.track(visual, 'downed', 1);
    const shown = (time: number) => frames.frame(player({ status: 'downed', weapon: 'carbine' }), visual, time);
    expect(shown(1 + beat * 1.5)).toBe(dead.frames[1]);
    expect(shown(1 + beat * 2.5)).toBe(dead.frames[2]);
    expect(shown(1 + beat * FIRST_LYING_FRAME + 0.01)).toBe(art.survivors[0].downed.frames[0]);
  });

  it('shows a survivor first seen dead as the corpse', () => {
    const at = walkThrough([['dead', 3]]);
    expect(at(3)).toBe(dead.frames[dead.frames.length - 1]);
  });

  it('drops the gun that was in hand, in palette', () => {
    const corpses = WEAPON_ORDER.map((weapon) => {
      const clip = deathWith(art.survivors[3].weapons[weapon], art.survivors[3].dead);
      return clip.frames[clip.frames.length - 1];
    });
    expect(new Set(corpses.map((sprite) => sprite.rgba.join())).size).toBe(WEAPON_ORDER.length);
    for (const sprite of corpses) {
      for (let i = 0; i < sprite.rgba.length; i += 4) {
        const opaque = sprite.rgba[i + 3] !== 0;
        if (opaque) expect(inPalette((sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2])).toBe(true);
      }
    }
  });
});

describe('the side-view reload hand', () => {
  it('shows the support hand at the belt in front of the body', () => {
    const belt: [number, number] = [22, 26];
    const sprite = drawPose(NIGHT, 'carbine', 0, { hand: belt, gunX: -2, gunY: 1 });
    const tones = new Set(NIGHT.hand);
    const y0 = belt[1] + bodyDrop(NIGHT);
    let found = 0;
    for (let y = y0 - 1; y <= y0 + 1; y += 1) {
      for (let x = belt[0] - 1; x <= belt[0] + 1; x += 1) {
        const i = (y * sprite.w + x) * 4;
        found += Number(tones.has((sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2]));
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('carries a reaching hand with the body bob', () => {
    const hand: [number, number] = [22, 26];
    const still = drawPose(NIGHT, 'carbine', 0, { hand });
    const bobbed = drawPose(NIGHT, 'carbine', 0, { hand, bodyY: 1 });
    const handRow = (sprite: PixelSprite) => {
      const tones = new Set(NIGHT.hand);
      for (let y = sprite.h - 1; y >= 0; y -= 1) {
        const i = (y * sprite.w + hand[0]) * 4;
        if (tones.has((sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2])) return y;
      }
      return -1;
    };
    expect(handRow(bobbed)).toBe(handRow(still) + 1);
  });
});

describe('ground shadows', () => {
  beforeEach(() => {
    installFakeBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('measures each zombie foot drop inside the reach of its south-facing soles', () => {
    const depth = (sprite: PixelSprite) => {
      const rows = Array.from({ length: sprite.h }, (_, y) => y);
      const painted = rows.filter((y) => sprite.rgba.subarray(y * sprite.w * 4, (y + 1) * sprite.w * 4).some((value, i) => i % 4 === 3 && value !== 0));
      return Math.max(...painted) - sprite.ay;
    };
    for (const type of Object.keys(art.zombies) as ZombieType[]) {
      const soles = art.zombies[type].walk[2].frames.map(depth);
      const drop = art.zombies[type].footDrop ?? -1;
      expect(drop, type).toBeGreaterThanOrEqual(Math.min(...soles));
      expect(drop, type).toBeLessThanOrEqual(Math.max(...soles));
    }
  });

  it('puts every shadow down before any figure, and a zombie shadow under its feet', () => {
    const visuals = new VisualStore();
    const entities = new EntityRenderer(art, visuals, new BuildingLayer(art.environment));
    const zombie: ZombieEntity = { id: 'z', type: 'brute', x: 120, y: 103, angle: 0, health: 1, maxHealth: 1, attacking: false };
    const scene = { ...EMPTY_SCENE, players: [player({ x: 120, y: 100 })], zombies: [zombie] };
    const ctx = installFakeBrowserCanvas();
    entities.drawWorld(ctx.context, scene, 0, 0, 320, 240, 0, 1 / 60);
    const sprites = new Set([visuals.get('me').sprite, visuals.get('z').sprite].map((sprite) => spriteCanvas(sprite!)));
    const kinds = ctx.calls.map(([image]) => (sprites.has(image as HTMLCanvasElement) ? 'sprite' : 'shadow'));
    expect(kinds).toEqual(['shadow', 'shadow', 'sprite', 'sprite']);
    const zombieShadow = ctx.calls[1];
    const shadowHeight = (zombieShadow[0] as HTMLCanvasElement).height;
    expect(zombieShadow[2]).toBe(zombie.y - Math.round(shadowHeight / 2) + (art.zombies.brute.footDrop ?? 0));
    const playerShadow = ctx.calls[0];
    expect((playerShadow[0] as HTMLCanvasElement).width).toBe(PLAYER_RADIUS * 2 + 2);
  });
});

/** A canvas context that records drawImage calls in order. */
function installFakeBrowserCanvas(): { context: CanvasRenderingContext2D; calls: unknown[][] } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d') as unknown as Record<string, unknown>;
  const calls: unknown[][] = [];
  context.drawImage = (...args: unknown[]) => {
    calls.push(args);
  };
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}
