// Turns poses into the clips for one person and one weapon.

import type { WeaponId } from '../../../shared/protocol.ts';
import type { Clip, DirClips, SurvivorWeaponArt } from '../types.ts';
import { makeClip } from '../kit.ts';
import type { DrawnDir, Point } from '../kit.ts';
import { mirrorFrames } from './cell.ts';
import { LEG_SETS } from './legs.ts';
import { BODY, drawPose } from './rig.ts';
import type { Person, Pose } from './rig.ts';
import { AXIS, GUNS } from './weapons.ts';

const WALK_BOB = [1, 1, 0, 1, 1, 0];
const HEAD_LAG = [-1, 0, 0, -1, 0, 0];
/** Seen from the front or back, the body rocks over the planted foot. */
const SWAY = [0, -1, 0, 0, 1, 0];

/** Rates chosen so a fire clip ends before the next shot of that gun. */
const FIRE_FPS: Record<WeaponId, number> = { pistol: 14, carbine: 18, shotgun: 6 };

function walkPoses(dir: DrawnDir): Pose[] {
  const set = LEG_SETS[dir];
  return set.cycle.map((near, i) => ({
    near,
    far: set.cycle[(i + 3) % 6],
    bodyX: dir === 2 || dir === 6 ? SWAY[i] : 0,
    bodyY: WALK_BOB[i],
    headY: HEAD_LAG[i],
  }));
}

function kicked(dir: DrawnDir, pixels: number): Pose {
  const [ax, ay] = AXIS[dir];
  return { gunX: -ax * pixels, gunY: -ay * pixels };
}

function firePoses(weapon: WeaponId, dir: DrawnDir): Pose[] {
  const [first, second] = GUNS[weapon].kick;
  const [ax, ay] = AXIS[dir];
  const peak: Pose = { ...kicked(dir, second), bodyX: -ax, bodyY: -ay };
  if (weapon === 'carbine') return [kicked(dir, first), peak];
  if (weapon === 'pistol') return [{ ...kicked(dir, first), gunY: -1 }, { ...peak, gunY: -2 }, kicked(dir, 1)];
  return [kicked(dir, first), { ...peak, headX: ax }, { ...kicked(dir, 1), rack: 3 }];
}

/** The gun comes in against the chest so the free hand can work on it. */
function tucked(weapon: WeaponId, dir: DrawnDir): { pose: Pose; port: Point; belt: Point } {
  const [ax, ay] = AXIS[dir];
  const gunX = -ax * 2;
  const gunY = -ay * 2 + 1;
  const view = GUNS[weapon].views[dir];
  return {
    pose: { gunX, gunY },
    port: [view.at[0] + view.port[0] + gunX, view.at[1] + view.port[1] + gunY],
    belt: BODY[dir].belt,
  };
}

function magazinePoses(weapon: WeaponId, dir: DrawnDir): Pose[] {
  const { pose, port, belt } = tucked(weapon, dir);
  const pulled: Point = [port[0], port[1] + 3];
  const fallen: Point = [port[0], Math.min(port[1] + 6, 30)];
  const landed: Point = [port[0], 33];
  const swap: Pose[] = [
    { ...pose, hand: port },
    { ...pose, hand: pulled, magOut: true, carrying: 'mag' },
    { ...pose, hand: belt, magOut: true, dropped: fallen },
    { ...pose, hand: belt, magOut: true, carrying: 'mag', dropped: landed },
    { ...pose, hand: pulled, magOut: true, carrying: 'mag' },
  ];
  if (weapon === 'pistol') return [...swap.slice(0, 3), swap[4], { ...pose, hand: port, gunY: (pose.gunY ?? 0) - 1 }];
  return [...swap, { ...pose, hand: port, gunY: (pose.gunY ?? 0) - 1 }];
}

function shotgunPoses(dir: DrawnDir): Pose[] {
  const { pose, port, belt } = tucked('shotgun', dir);
  const load: Pose = { ...pose, hand: port, carrying: 'shell' };
  const fetch: Pose = { ...pose, hand: belt, carrying: 'shell' };
  const shove: Pose = { ...pose, hand: port, gunY: (pose.gunY ?? 0) + 1 };
  return [fetch, load, shove, fetch, load, { rack: 3 }];
}

function clip(person: Person, weapon: WeaponId, dir: DrawnDir, poses: readonly Pose[], fps: number, loop: boolean): Clip {
  return makeClip(poses.map((pose) => drawPose(person, weapon, dir, pose)), fps, loop);
}

/** Like the kit's dirClips, with the fast mirror. */
function facings(build: (dir: DrawnDir) => Clip): DirClips {
  const mirrored = (from: Clip): Clip => ({ ...from, frames: mirrorFrames(from.frames) });
  const [e, se, s, n, ne] = ([0, 1, 2, 6, 7] as const).map(build);
  return [e, se, s, mirrored(se), mirrored(e), mirrored(ne), n, ne];
}

/** Just the standing clips, for callers that need a look at each facing and not the whole kit. */
export function idleClips(person: Person, weapon: WeaponId): DirClips {
  return facings((dir) => clip(person, weapon, dir, [{}], 2, true));
}

export function weaponClips(person: Person, weapon: WeaponId): SurvivorWeaponArt {
  const reload = (dir: DrawnDir) => (weapon === 'shotgun' ? shotgunPoses(dir) : magazinePoses(weapon, dir));
  return {
    idle: facings((dir) => clip(person, weapon, dir, [{}, { bodyY: 1 }], 2, true)),
    walk: facings((dir) => clip(person, weapon, dir, walkPoses(dir), 10, true)),
    fire: facings((dir) => clip(person, weapon, dir, firePoses(weapon, dir), FIRE_FPS[weapon], false)),
    reload: facings((dir) => clip(person, weapon, dir, reload(dir), 6, false)),
  };
}
