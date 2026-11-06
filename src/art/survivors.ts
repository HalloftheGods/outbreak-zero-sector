// Skins in the order of shared/characters.ts. See survivors/rig.ts for how a figure is built.

import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import type { SurvivorArt, SurvivorWeaponArt } from './types.ts';
import type { DrawnDir } from './kit.ts';
import { ANCHOR_X, ANCHOR_Y } from './survivors/cell.ts';
import { idleClips, weaponClips } from './survivors/clips.ts';
import { deadClip, downedClip } from './survivors/fallen.ts';
import { KHRONUS8 } from './survivors/khronus8.ts';
import { NIGHT } from './survivors/night.ts';
import { portraitOf, portraitsOf } from './survivors/portrait.ts';
import { REX } from './survivors/rex.ts';
import { bodyDrop } from './survivors/rig.ts';
import type { Person } from './survivors/rig.ts';
import { SATORI } from './survivors/satori.ts';
import { SOL } from './survivors/sol.ts';
import { GUNS } from './survivors/weapons.ts';

/** Facings drawn by hand, and which of them each mirrored facing copies. */
const MIRRORED: readonly (readonly [DrawnDir, boolean])[] = [
  [0, false], [1, false], [2, false], [1, true], [0, true], [7, true], [6, false], [7, false],
];

function muzzleOffsets(id: WeaponId): readonly { x: number; y: number }[] {
  return MIRRORED.map(([dir, mirrored]) => {
    const { at, tip } = GUNS[id].views[dir];
    const x = at[0] + tip[0] - ANCHOR_X;
    return { x: mirrored ? -x - 1 : x, y: at[1] + tip[1] - ANCHOR_Y };
  });
}

/** The barrel tip at rest, per weapon and direction, relative to the sprite anchor. */
export const MUZZLE_OFFSETS: Record<WeaponId, readonly { x: number; y: number }[]> = {
  pistol: muzzleOffsets('pistol'),
  carbine: muzzleOffsets('carbine'),
  shotgun: muzzleOffsets('shotgun'),
};

const CAST: readonly Person[] = [NIGHT, KHRONUS8, SATORI, REX, SOL];

/**
 * Each weapon's clips draw on first use. A solo run only ever touches one person, and
 * three quarters of a thousand frames is too much to pay for at page load.
 */
function lazyWeapons(person: Person): Record<WeaponId, SurvivorWeaponArt> {
  const built = new Map<WeaponId, SurvivorWeaponArt>();
  const weapons = {} as Record<WeaponId, SurvivorWeaponArt>;
  for (const id of WEAPON_ORDER) {
    Object.defineProperty(weapons, id, {
      enumerable: true,
      get() {
        const clips = built.get(id) ?? weaponClips(person, id);
        built.set(id, clips);
        return clips;
      },
    });
  }
  return weapons;
}

function art(person: Person): SurvivorArt {
  return {
    weapons: lazyWeapons(person),
    downed: downedClip(person),
    dead: deadClip(person),
    portrait: portraitOf(person),
    portraits: portraitsOf(person, idleClips(person, 'pistol')),
    gunDrop: bodyDrop(person),
  };
}

export function buildSurvivors(): readonly SurvivorArt[] {
  return CAST.map(art);
}
