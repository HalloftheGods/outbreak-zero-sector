import type { BuildingKind, PickupType, PropKind, TileKind, WeaponId, ZombieType } from '../../shared/protocol.ts';
import type { ContainerArt, ContainerLook } from './containers.ts';

/**
 * A baked image. Art is pure data so it builds in Node (contact sheets, tests)
 * as well as the browser. The renderer uploads rgba to canvases once at load.
 */
export interface PixelSprite {
  readonly w: number;
  readonly h: number;
  /** Anchor in sprite pixels: the feet of a character, footprint bottom-centre of a prop. */
  readonly ax: number;
  readonly ay: number;
  /** w*h*4 straight-alpha RGBA. Every alpha is 0 or 255: no anti-aliasing. */
  readonly rgba: Uint8ClampedArray;
}

export interface Clip {
  readonly frames: readonly PixelSprite[];
  readonly fps: number;
  readonly loop: boolean;
}

/** Eight clips indexed by dirFromAngle: 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE (y down). */
export type DirClips = readonly Clip[];

export function dirFromAngle(angle: number): number {
  return ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
}

export interface SurvivorWeaponArt {
  readonly idle: DirClips;
  readonly walk: DirClips;
  readonly fire: DirClips;
  readonly reload: DirClips;
}

export interface SurvivorArt {
  readonly weapons: Record<WeaponId, SurvivorWeaponArt>;
  readonly downed: Clip;
  readonly dead: Clip;
  /** The figure the title screen shows. */
  readonly portrait: PixelSprite;
  /** Pixels this survivor's gun sits below the standard build's, for the muzzle flash. */
  readonly gunDrop: number;
}

export interface ZombieArt {
  readonly walk: DirClips;
  readonly attack: DirClips;
  /** Plays once. The last frame stays on the ground as the corpse. */
  readonly death: Clip;
}

export interface EnvironmentArt {
  /** Variants per tile kind, each exactly TILE_SIZE square. */
  readonly tiles: Record<TileKind, readonly PixelSprite[]>;
  readonly props: Record<PropKind, PixelSprite>;
  /**
   * Exterior shell per building: roof plus south front wall with the door at doorX, anchored
   * at the bottom-centre of the footprint. The roof fades out when the local player is
   * inside, revealing floor tiles and walls, so a shell must cover its whole footprint.
   * Several facades per kind stop repeats reading as copies.
   */
  readonly buildings: Record<BuildingKind, readonly PixelSprite[]>;
  /** Tiled along walls seen from inside. wallFace is 16 wide, the north wall's inner face; wallCap is 16x16, the wall tops. */
  readonly interior: { readonly wallFace: PixelSprite; readonly wallCap: PixelSprite; readonly doorMat: PixelSprite };
  /** fire_barrel flames, drawn over its prop. */
  readonly barrelFire: Clip;
  /** The way out of a level, and its blinking hazard lights. */
  readonly escapeVan: PixelSprite;
  readonly escapeVanLights: Clip;
}

export interface FxArt {
  /** Muzzle flash per weapon, drawn at the barrel tip, one clip per direction. */
  readonly muzzle: Record<WeaponId, DirClips>;
  readonly tracer: DirClips;
  readonly bulletImpact: Clip;
  readonly bloodBurst: Clip;
  /** Permanent ground stains. */
  readonly bloodDecals: readonly PixelSprite[];
  readonly acidBurst: Clip;
  readonly acidDecals: readonly PixelSprite[];
  readonly smokePuff: Clip;
  readonly shellCasing: PixelSprite;
  readonly shotgunShell: PixelSprite;
}

export interface UiArt {
  readonly crosshair: PixelSprite;
  /** The crosshair over a zombie's head. */
  readonly crosshairHead: PixelSprite;
  readonly weaponIcons: Record<WeaponId, PixelSprite>;
  readonly pickupIcons: Record<PickupType, PixelSprite>;
  readonly heart: PixelSprite;
  readonly skull: PixelSprite;
  /** Title lockup for the menu and game over screens. */
  readonly logo: PixelSprite;
}

export interface ArtBook {
  /** One per skin, SURVIVOR_SKIN_COUNT long. */
  readonly survivors: readonly SurvivorArt[];
  readonly zombies: Record<ZombieType, ZombieArt>;
  readonly environment: EnvironmentArt;
  /** Floating ground pickups with a bob, looped. */
  readonly pickups: Record<PickupType, Clip>;
  /** Searchable furniture and vehicles, shut and searched, each drawn in place of its prop. */
  readonly containers: Record<ContainerLook, ContainerArt>;
  readonly fx: FxArt;
  readonly ui: UiArt;
}
