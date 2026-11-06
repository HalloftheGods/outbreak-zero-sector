// Skins in the order of shared/characters.ts. See survivors/rig.ts for how a figure is built.

import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import type { PixelSprite, SurvivorArt, SurvivorWeaponArt } from './types.ts';
import type { DrawnDir } from './kit.ts';
import { ANCHOR_X, ANCHOR_Y } from './survivors/cell.ts';
import { idleClips, weaponClips } from './survivors/clips.ts';
import { deadClip, downedClip } from './survivors/fallen.ts';
import { BANDUS } from './survivors/bandus.ts';
import type { BustDef } from './survivors/bust.ts';
import { bustOf } from './survivors/bust.ts';
import { BANDUS_BUST } from './survivors/busts/bandus.ts';
import { NIGHT_BUST } from './survivors/busts/night.ts';
import { REX_BUST } from './survivors/busts/rex.ts';
import { SATORI_BUST } from './survivors/busts/satori.ts';
import { SOL_BUST } from './survivors/busts/sol.ts';
import type { Costume } from './survivors/costume.ts';
import { BANDUS_COSTUMES } from './survivors/costumes/bandus.ts';
import { NIGHT_COSTUMES } from './survivors/costumes/night.ts';
import { REX_COSTUMES } from './survivors/costumes/rex.ts';
import { SATORI_COSTUMES } from './survivors/costumes/satori.ts';
import { SOL_COSTUMES } from './survivors/costumes/sol.ts';
import { NIGHT } from './survivors/night.ts';
import { portraitOf, portraitsOf } from './survivors/portrait.ts';
import { REX } from './survivors/rex.ts';
import { gunDrop } from './survivors/rig.ts';
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

const CAST: readonly Person[] = [NIGHT, BANDUS, SATORI, REX, SOL];
/** The select screen's picture of each, in the same order as CAST. */
const BUSTS: readonly BustDef[] = [NIGHT_BUST, BANDUS_BUST, SATORI_BUST, REX_BUST, SOL_BUST];
/**
 * Each survivor's costumes, default first, in the same order as CAST. shared/characters.ts
 * declares the same ids and names, and tests/costumes-wiring.spec.ts checks that they agree.
 */
export const COSTUMES: readonly (readonly Costume[])[] = [NIGHT_COSTUMES, BANDUS_COSTUMES, SATORI_COSTUMES, REX_COSTUMES, SOL_COSTUMES];

/** A survivor record before its costume list is attached. */
type Look = Omit<SurvivorArt, 'costumes'>;

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

function look(person: Person, select: PixelSprite): Look {
  return {
    weapons: lazyWeapons(person),
    downed: downedClip(person),
    dead: deadClip(person),
    portrait: portraitOf(person),
    portraits: portraitsOf(person, idleClips(person, 'pistol')),
    select,
    gunDrop: gunDrop(person),
  };
}

/** The record with its costume list attached, hidden from key walks (see SurvivorArt.costumes). */
function wear(record: Look, costumes: readonly SurvivorArt[]): SurvivorArt {
  return Object.defineProperty({ ...record, costumes }, 'costumes', { enumerable: false });
}

/**
 * The survivor's own record, holding a list of one record per costume. Index 0 is that
 * record; the others draw on first read, so building the book costs what it did before
 * costumes. A costume wears the survivor's hand-drawn select bust until it has its own.
 */
function dressed(own: Look, costumes: readonly Costume[]): SurvivorArt {
  const list: SurvivorArt[] = [];
  const built: SurvivorArt[] = [wear(own, list)];
  costumes.forEach((costume, index) => {
    Object.defineProperty(list, index, {
      enumerable: true,
      get() {
        built[index] ??= wear(look(costume.person, own.select), list);
        return built[index];
      },
    });
  });
  Object.freeze(list);
  return built[0];
}

function art(person: Person, index: number): SurvivorArt {
  return dressed(look(person, bustOf(BUSTS[index])), COSTUMES[index]);
}

export function buildSurvivors(): readonly SurvivorArt[] {
  return CAST.map(art);
}
