// Single source of truth for everything that crosses the sim/client boundary.
// Pure data and types only, so it loads in the browser, Node and vitest alike.

import { CHARACTERS } from './characters.ts';
import type { DifficultyId } from './difficulty.ts';
import type { EmoteId } from './emotes.ts';
import { GAME_EVENT_TYPES, GAME_PHASES, PICKUP_TYPES } from './events.ts';
import type { Point } from './flow-field.ts';
import type { GameStyle } from './game-style.ts';
import type { PartId } from './gun-upgrade-data.ts';
import type { PlayerGear } from './gun-upgrades.ts';
import type { HomeAction, HomeView, JoinHome, OverrunEnd, RoomHomeView, Station } from './home-protocol.ts';
import type { GunEffect, RoundKitId } from './round-effect-data.ts';
import type { BenchAction, BenchView } from './workbench.ts';
import type { Box } from './world-query.ts';

export { GAME_EVENT_TYPES, GAME_PHASES, PICKUP_TYPES };

export type EntityId = string;

export type WeaponId = 'pistol' | 'carbine' | 'shotgun';
export type ZombieType = 'walker' | 'runner' | 'bloater' | 'brute' | 'screamer';
export type PickupType = (typeof PICKUP_TYPES)[number];
export type PlayerStatus = 'alive' | 'downed' | 'dead';
export type GamePhase = (typeof GAME_PHASES)[number];
/** How a survivor is moving: sneaking is slow and hard to spot, sprinting is fast and loud. */
export type Stance = 'walk' | 'sneak' | 'sprint';

export const WEAPON_ORDER: readonly WeaponId[] = ['pistol', 'carbine', 'shotgun'];
export const SURVIVOR_SKIN_COUNT = CHARACTERS.length;

export interface PlayerEntity {
  readonly id: EntityId;
  name: string;
  /** Index into CHARACTERS and the survivor art. No two players in a room share one. */
  skin: number;
  x: number;
  y: number;
  angle: number;
  moving: boolean;
  status: PlayerStatus;
  health: number;
  maxHealth: number;
  weapon: WeaponId;
  /** Rounds in the current magazine. */
  ammo: number;
  magSize: number;
  /** Spare rounds for the current weapon. Every gun is finite, and reloading only moves rounds out of this. */
  reserve: number;
  /** Weapons this player owns, in WEAPON_ORDER. */
  owned: WeaponId[];
  /** Spare rounds per weapon, for the HUD slots. */
  ammoBag: Record<WeaponId, number>;
  /** Rounds loaded in each gun, so the HUD can show a loaded gun that is not in hand. 0 for guns not owned. */
  mags: Record<WeaponId, number>;
  /** Medkits carried, used with the heal input. */
  medkits: number;
  /** Carrying a knife, which makes the shove a stab. */
  knife: boolean;
  /** Empty bottles to throw. Left off at none. */
  bottles?: number;
  /** Sprint stamina, 1 full to 0 empty. Left off while full. */
  stamina?: number;
  /** Ran dry: sprint is off until the bar refills past the re-arm mark. Left off when not. */
  winded?: boolean;
  /** 0 when not searching, otherwise 0..1 through the search. */
  search: number;
  /** Id of the building this player stands in, or null outdoors. */
  indoors: string | null;
  /** 0 when not reloading, otherwise 0..1 through the reload. */
  reload: number;
  /** Seconds until a downed player dies. 0 unless downed. */
  bleedout: number;
  /** 0..1 progress of a teammate reviving this downed player. */
  revive: number;
  score: number;
  kills: number;
  /** Highest input seq applied; the client reconciles prediction against it. */
  lastInputSeq: number;
  /** Parts carried and work done on guns, left off for someone with neither. */
  gear?: PlayerGear;
  /** Treasure carried, station and trip result. Left off outside home mode. */
  home?: HomeView;
}

export interface ZombieEntity {
  readonly id: EntityId;
  readonly type: ZombieType;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  /** True during the attack wind-up and swing, drives the attack clip. */
  attacking: boolean;
  /** On fire, which glows. Left off unless true. */
  burning?: boolean;
  /** Stacks of acid on it, 1 up to CORROSION_MAX_STACKS. Left off at none. */
  corrosion?: number;
  /** Slowed by a tranq round. Left off unless true. */
  slowed?: boolean;
  /** Following someone's prints in the snow. Left off unless true. */
  tracking?: boolean;
}

/** A footprint in the snow, for drawing: where, which way it points, and seconds before it fills in. */
export interface TrackEntity {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly left: number;
}

export interface BulletEntity {
  readonly id: EntityId;
  readonly shooterId: EntityId;
  x: number;
  y: number;
  /** World pixels per second. */
  vx: number;
  vy: number;
  /** What the gun it came from fires. Left off for a plain round. */
  effect?: GunEffect;
}

export interface PickupEntity {
  readonly id: EntityId;
  readonly type: PickupType;
  x: number;
  y: number;
}

export interface PlayerRunStats {
  readonly id: EntityId;
  readonly name: string;
  readonly skin: number;
  readonly kills: number;
  readonly score: number;
}

/** How a run ended: everyone fell, or the van left the last town. */
export type RunOutcome = 'defeat' | 'victory';

export interface GameOverStats {
  readonly outcome: RunOutcome;
  /** What the run was played on. */
  readonly difficulty: DifficultyId;
  /** Level reached, 1 up to the last. */
  readonly level: number;
  /** Hordes survived over the whole run, every town added up. */
  readonly wave: number;
  readonly durationSec: number;
  readonly players: readonly PlayerRunStats[];
}

/** The van out of town, there once the level's last horde is survived. Draw it as a `van_h` prop at x,y. */
export interface ExitEntity {
  readonly x: number;
  readonly y: number;
  /** 0..1 through the wait with everyone at the van, 0 until they all are. */
  readonly progress: number;
}

/** One-shot facts for audio, particles and banners. Every field is in world space. */
export type GameEvent =
  | { readonly type: 'shot'; readonly playerId: EntityId; readonly weapon: WeaponId; readonly x: number; readonly y: number; readonly angle: number; readonly suppressed?: boolean; readonly effect?: GunEffect }
  | { readonly type: 'dry_fire'; readonly playerId: EntityId; readonly x: number; readonly y: number }
  | { readonly type: 'melee'; readonly playerId: EntityId; readonly x: number; readonly y: number; readonly angle: number; readonly hit: boolean }
  | { readonly type: 'heal'; readonly playerId: EntityId; readonly x: number; readonly y: number; readonly amount: number }
  | { readonly type: 'zombie_alert'; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number }
  /** A roamer put its nose on someone's snow trail and started following it. */
  | { readonly type: 'zombie_track'; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number }
  | { readonly type: 'reload_start'; readonly playerId: EntityId; readonly weapon: WeaponId; readonly x: number; readonly y: number }
  | { readonly type: 'reload_end'; readonly playerId: EntityId; readonly weapon: WeaponId; readonly x: number; readonly y: number }
  | { readonly type: 'weapon_switch'; readonly playerId: EntityId; readonly weapon: WeaponId; readonly x: number; readonly y: number }
  | { readonly type: 'bullet_impact'; readonly x: number; readonly y: number; readonly angle: number }
  | { readonly type: 'zombie_hit'; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number; readonly angle: number }
  /** A round's effect took hold: a body lit (`caught` if off another body), acid went a stack deeper, a tranq landed, or a bullet went through. */
  | { readonly type: 'zombie_status'; readonly effect: GunEffect; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number; readonly caught?: boolean; readonly stacks?: number }
  | { readonly type: 'headshot'; readonly playerId: EntityId; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number; readonly angle: number; readonly points: number }
  | { readonly type: 'zombie_die'; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number; readonly angle: number; readonly killerId: EntityId | null; readonly points: number }
  | { readonly type: 'zombie_attack'; readonly zombieId: EntityId; readonly zombieType: ZombieType; readonly x: number; readonly y: number }
  | { readonly type: 'bloater_burst'; readonly x: number; readonly y: number; readonly radius: number }
  | { readonly type: 'player_hurt'; readonly playerId: EntityId; readonly x: number; readonly y: number; readonly damage: number }
  | { readonly type: 'player_downed'; readonly playerId: EntityId; readonly x: number; readonly y: number }
  | { readonly type: 'player_revived'; readonly playerId: EntityId; readonly x: number; readonly y: number }
  | { readonly type: 'player_dead'; readonly playerId: EntityId; readonly x: number; readonly y: number }
  | { readonly type: 'pickup'; readonly playerId: EntityId; readonly pickup: PickupType; readonly x: number; readonly y: number }
  | { readonly type: 'container_opened'; readonly playerId: EntityId; readonly container: number; readonly x: number; readonly y: number; readonly found: boolean; readonly noisy: boolean; readonly bottle?: boolean }
  /** A thrown bottle broke at x,y, thrown from fromX,fromY. */
  | { readonly type: 'bottle_smash'; readonly playerId: EntityId; readonly x: number; readonly y: number; readonly fromX: number; readonly fromY: number }
  | { readonly type: 'car_alarm'; readonly x: number; readonly y: number }
  | { readonly type: 'wave_intermission'; readonly wave: number; readonly seconds: number }
  | { readonly type: 'wave_start'; readonly wave: number; readonly hostiles: number }
  | { readonly type: 'wave_clear'; readonly wave: number }
  | { readonly type: 'exit_open'; readonly level: number; readonly x: number; readonly y: number }
  | { readonly type: 'level_complete'; readonly level: number }
  | { readonly type: 'level_start'; readonly level: number }
  /** The van left the bunker for a town. `attempt` is the room's trip serial. */
  | { readonly type: 'trip_start'; readonly level: number; readonly attempt: number }
  /** Something at the blast door: `step` counts the warnings from 0, `left` is the clock's seconds then. */
  | { readonly type: 'overrun_warning'; readonly step: number; readonly left: number }
  | { readonly type: 'overrun_breach'; readonly hostiles: number }
  | { readonly type: 'overrun_end'; readonly outcome: OverrunEnd }
  /** A survivor sent an icon. Only the id travels; the client finds the body by playerId. */
  | { readonly type: 'emote'; readonly playerId: EntityId; readonly emote: EmoteId }
  | { readonly type: 'game_over'; readonly stats: GameOverStats };

/** Compiles only while GAME_EVENT_TYPES lists exactly the names GameEvent declares. */
export const EVENT_TYPES_MATCH: [GameEvent['type']] extends [(typeof GAME_EVENT_TYPES)[number]]
  ? [(typeof GAME_EVENT_TYPES)[number]] extends [GameEvent['type']] ? true : never
  : never = true;

export interface ClientInputPacket {
  readonly seq: number;
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
  /** Radians, world space, y down: 0 = east, PI/2 = south. */
  readonly angle: number;
  /** The crosshair as a spot in the drawn world, where heads are judged. Left off when there is no crosshair. */
  readonly aimX?: number;
  readonly aimY?: number;
  /** Aimed with a finger. Left off for a mouse. */
  readonly touch?: boolean;
  readonly shoot: boolean;
  readonly reload: boolean;
  /** Requested weapon, or null. The sim ignores weapons the player does not own. */
  readonly weapon: WeaponId | null;
  /** Shove with the gun: weak, noiseless, always available. */
  readonly melee: boolean;
  /** Use a carried medkit. */
  readonly heal: boolean;
  /** The search key is held down. */
  readonly search: boolean;
  /** Throw a bottle at the crosshair. Left off when not. */
  readonly throw?: boolean;
  /** The sneak key is held. Left off when not. Wins over sprint when both are held. */
  readonly sneak?: boolean;
  /** The sprint key is held. Left off when not. */
  readonly sprint?: boolean;
}

export interface SnapshotPacket {
  readonly type: 'snapshot';
  readonly tick: number;
  readonly phase: GamePhase;
  /** Level of the run, 1 up to the last. */
  readonly level: number;
  /** The town being played: generateWorldMap(mapSeed, level). A change means the map changed, whatever the events said. */
  readonly mapSeed: number;
  /** Horde number in this town. Phase 'intermission' is the scavenging lull, phase 'wave' is a horde hunting the players. */
  readonly wave: number;
  /** Seconds to the next horde during intermission, otherwise 0. */
  readonly intermission: number;
  /** Zombies of the current horde alive or still to spawn; 0 during the lull. Roaming town zombies don't count. */
  readonly hostiles: number;
  readonly players: readonly PlayerEntity[];
  readonly zombies: readonly ZombieEntity[];
  readonly bullets: readonly BulletEntity[];
  readonly pickups: readonly PickupEntity[];
  /** The way out of this town, sent to everyone wherever they stand, or null until it opens. */
  readonly exit: ExitEntity | null;
  /** Ids of the town's containers that have been opened, so everyone sees them open. */
  readonly openedContainers: readonly number[];
  /** Footprints in a snowy town near this viewer. Left off when there are none. */
  readonly tracks?: readonly TrackEntity[];
  /** Events since the previous snapshot, in order. */
  readonly events: readonly GameEvent[];
  readonly gameOver: GameOverStats | null;
  /** Present while the run is held at the workbench between towns. */
  readonly bench?: BenchView;
  /** The room's level pick and reach. Left off outside home mode. */
  readonly home?: RoomHomeView;
}

export interface WelcomePacket {
  readonly type: 'welcome';
  readonly yourId: EntityId;
  readonly tickRate: number;
  /** generateWorldMap(mapSeed, level) rebuilds the town being played when this client joined. */
  readonly mapSeed: number;
  /** The level of that town, which picks its biome. Left off, level 1. */
  readonly level?: number;
  /** What the room is played on: a guest plays the first player's choice, not their own. */
  readonly difficulty?: DifficultyId;
  /** This join took back a body the room was still holding. Left off for a new one. */
  readonly resumed?: boolean;
}

/**
 * What the room plays, or null for an empty one that the next join decides. Sent on connection, so a client
 * knows what to bring before it joins, and again to a join that named another style, which the room did not take.
 */
export interface RoomPacket {
  readonly type: 'room';
  readonly style: GameStyle | null;
}

/** Bumped by any change to a packet. A host closes a join from another version with 4014. */
export const PROTOCOL_VERSION = 2;

/**
 * Sent just before a link is closed on purpose, because a data channel has no close code.
 * Over a socket the same pair also rides the close frame.
 */
export interface ByePacket {
  readonly type: 'bye';
  readonly code: number;
  readonly reason: string;
}

export type ServerPacket =
  | RoomPacket
  | WelcomePacket
  | SnapshotPacket
  | ByePacket
  | { readonly type: 'player_disconnected'; readonly playerId: EntityId };

export type ClientPacket =
  /** The difficulty is read from the first player into an empty room and ignored from everyone after. The style must be the room's; an empty room takes it, and left off it is Arcade. The protocol is the sender's PROTOCOL_VERSION; only a LAN server takes a join without one. */
  | { readonly type: 'join'; readonly name: string; readonly token: string; readonly difficulty?: DifficultyId; readonly character?: number; readonly home?: JoinHome; readonly style?: GameStyle; readonly protocol?: number }
  | { readonly type: 'input'; readonly input: ClientInputPacket }
  | { readonly type: 'bench'; readonly action: BenchAction }
  | { readonly type: 'home'; readonly action: HomeAction }
  | { readonly type: 'emote'; readonly emote: EmoteId }
  | { readonly type: 'restart' };

// --- World map -------------------------------------------------------------

export const TILE_SIZE = 16;

export const TILE_KINDS = [
  'asphalt',
  'asphalt_cracked',
  'lane_h',
  'lane_v',
  'crosswalk_h',
  'crosswalk_v',
  'parking_line',
  'sidewalk',
  'curb_n',
  'curb_s',
  'curb_e',
  'curb_w',
  'grass',
  'dirt',
  /** Shallow flood water, drifted snow, cinders and toxic sludge: ground a biome lays over grass, dirt and road. All walkable. */
  'water',
  'snow',
  'ash',
  'sludge',
  'floor_wood',
  'floor_tile',
  'floor_concrete',
  'floor_carpet',
  'bunker_wall',
] as const;
export type TileKind = (typeof TILE_KINDS)[number];

/**
 * Footprints in world pixels. A prop instance's x,y is the centre of the bottom
 * edge of its footprint, so the solid box is [x-w/2, y-h, x+w/2, y]. Art may rise
 * above the footprint (building fronts, tree crowns) and is y-sorted on prop.y.
 * Footprint h of 0 means walk-through scenery.
 */
export const PROP_DEFS = {
  car_sedan_h: { w: 44, h: 18 },
  car_sedan_v: { w: 20, h: 40 },
  car_wreck_h: { w: 44, h: 18 },
  van_h: { w: 52, h: 22 },
  dumpster: { w: 30, h: 14 },
  crate_stack: { w: 20, h: 14 },
  barrier: { w: 32, h: 8 },
  sandbags: { w: 36, h: 10 },
  tree: { w: 12, h: 8 },
  fire_barrel: { w: 12, h: 8 },
  street_lamp: { w: 6, h: 4 },
  hydrant: { w: 6, h: 4 },
  /** Evergreen: a narrow trunk under a dark spire. */
  pine: { w: 10, h: 6 },
  /** Saguaro: solid, but thin enough to walk round. */
  cactus: { w: 8, h: 6 },
  dead_tree: { w: 10, h: 6 },
  bush: { w: 0, h: 0 },
  /** Dry scrub and tumbleweed: walk-through, like bush. */
  scrub: { w: 0, h: 0 },
  /** Marsh reeds and cattails: walk-through. */
  reeds: { w: 0, h: 0 },
  /** A giant fungus: solid, for the blighted and infested towns. */
  fungus: { w: 10, h: 6 },
  rubble: { w: 0, h: 0 },
  fence_h: { w: 32, h: 6 },
  fence_v: { w: 6, h: 32 },
  gas_pump: { w: 12, h: 8 },
  shelf: { w: 32, h: 10 },
  counter: { w: 48, h: 12 },
  table: { w: 24, h: 14 },
  sofa: { w: 36, h: 14 },
  bed: { w: 24, h: 32 },
  locker: { w: 16, h: 8 },
  fridge: { w: 16, h: 8 },
  workbench: { w: 40, h: 12 },
  forge: { w: 40, h: 12 },
  level_map: { w: 24, h: 14 },
  jukebox: { w: 20, h: 8 },
  gunsmith: { w: 12, h: 8 },
  quartermaster: { w: 12, h: 8 },
  medic: { w: 12, h: 8 },
  powder: { w: 12, h: 8 },
  /** Set into the hall's west wall, its footprint all rock, so nothing walks differently for it. */
  blast_door: { w: 16, h: 48 },
  chest: { w: 16, h: 10 },
} as const;
export type PropKind = keyof typeof PROP_DEFS;
export const PROP_KINDS = Object.keys(PROP_DEFS) as PropKind[];

/**
 * Enterable buildings. w,h is the footprint in world pixels (multiples of TILE_SIZE),
 * walls included. doorX is the door's centre measured from the footprint's left edge,
 * always on the south wall, and DOOR_WIDTH wide so it lines up with whole tiles.
 */
export const DOOR_WIDTH = 32;
export const WALL_THICKNESS = 6;
export const BUILDING_DEFS = {
  pharmacy: { label: 'Pharmacy', w: 160, h: 112, doorX: 80, floor: 'floor_tile' },
  clinic: { label: 'Clinic', w: 192, h: 128, doorX: 96, floor: 'floor_tile' },
  police: { label: 'Police Station', w: 224, h: 144, doorX: 112, floor: 'floor_concrete' },
  gun_shop: { label: 'Gun Shop', w: 144, h: 112, doorX: 48, floor: 'floor_wood' },
  grocery: { label: 'Grocery', w: 208, h: 128, doorX: 64, floor: 'floor_tile' },
  discount: { label: 'S.O.S. Discount', w: 176, h: 112, doorX: 64, floor: 'floor_tile' },
  diner: { label: 'Diner', w: 160, h: 96, doorX: 112, floor: 'floor_tile' },
  garage: { label: 'Auto Garage', w: 176, h: 112, doorX: 48, floor: 'floor_concrete' },
  warehouse: { label: 'Warehouse', w: 240, h: 144, doorX: 192, floor: 'floor_concrete' },
  house: { label: 'House', w: 112, h: 96, doorX: 48, floor: 'floor_wood' },
  apartment: { label: 'Apartments', w: 160, h: 128, doorX: 80, floor: 'floor_carpet' },
} as const;
export type BuildingKind = keyof typeof BUILDING_DEFS;
export const BUILDING_KINDS = Object.keys(BUILDING_DEFS) as BuildingKind[];

export interface BuildingInstance {
  readonly id: string;
  readonly kind: BuildingKind;
  /** Top-left corner of the footprint, on the tile grid. */
  readonly x: number;
  readonly y: number;
  /** Picks a facade from the art's variants. */
  readonly variant: number;
}

/** A named part of town, for the map screen. */
export interface District {
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

export interface PropInstance {
  readonly kind: PropKind;
  readonly x: number;
  readonly y: number;
}

export interface MapLight {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  /** CSS colour. */
  readonly color: string;
  readonly flicker: boolean;
}

export interface WorldMap {
  readonly seed: number;
  /** World size in pixels, a multiple of TILE_SIZE. */
  readonly width: number;
  readonly height: number;
  readonly cols: number;
  readonly rows: number;
  /** cols*rows indices into TILE_KINDS, row-major. */
  readonly tiles: Uint8Array;
  readonly props: readonly PropInstance[];
  readonly buildings: readonly BuildingInstance[];
  readonly districts: readonly District[];
  readonly lights: readonly MapLight[];
  /** Open ground for players to start on. */
  readonly spawn: { readonly x: number; readonly y: number };
  /** Solids that are not buildings. Set, these are every wall there is. */
  readonly walls?: readonly Box[];
  /** Where the van stands, when the map says so rather than the town's walk. */
  readonly exit?: Point;
  /** What can be walked up to and opened. */
  readonly stations?: readonly Station[];
}
