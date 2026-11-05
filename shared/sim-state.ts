import type { DifficultyId } from './difficulty.ts';
import type {
  BulletEntity,
  EntityId,
  GameEvent,
  GameOverStats,
  GamePhase,
  PickupEntity,
  PlayerEntity,
  WeaponId,
  WorldMap,
  ZombieEntity,
  ZombieType,
} from './protocol.ts';
import type { ContainerState } from './containers.ts';
import type { FlowField, Point } from './flow-field.ts';
import { randRange } from './rng.ts';
import type { Rng } from './rng.ts';
import type { SpatialHashGrid } from './spatial-grid.ts';
import { buildingAt, circleHitsSolid, isBlockedAt } from './world-query.ts';
import type { GunQuirk, PartCounts } from './gun-upgrade-data.ts';
import type { GunFit } from './gun-upgrades.ts';
import type { BenchState, WorkbenchMode } from './workbench.ts';

/** Rounds in the gun itself. Spare rounds live in PlayerEntity.ammoBag, gun or no gun. */
export interface GunState {
  ammo: number;
  /** Quirk and upgrades, absent on a stock gun. Goes when the gun does. */
  fit?: GunFit;
}

/** Magazines live in `guns` and are read out for snapshots, so there is one copy of the count. */
export interface PlayerState extends Omit<PlayerEntity, 'mags' | 'gear'> {
  parts: PartCounts;
  /** Said so at the current workbench. */
  benchReady: boolean;
  /** Reconnect token, or null when nobody can come back as this player. Never sent to clients. */
  readonly token: string | null;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  /** Where the crosshair last was in the drawn world, or null from a client that never said. */
  aim: Point | null;
  /** The crosshair is under a finger, which earns a little slack on heads. */
  touchAim: boolean;
  /** Latest seq seen by setInput, applied on the next tick. */
  queuedSeq: number;
  /** Latched by setInput until a tick consumes them, so a later packet cannot erase them. */
  reloadQueued: boolean;
  weaponQueued: WeaponId | null;
  meleeQueued: boolean;
  healQueued: boolean;
  /** A press seen since the last tick, so a tap between ticks still fires. */
  shootQueued: boolean;
  guns: Partial<Record<WeaponId, GunState>>;
  fireCooldown: number;
  dryFireCooldown: number;
  meleeCooldown: number;
  /** Seconds left on the current reload, 0 when not reloading. */
  reloadLeft: number;
  /** The search key is down. */
  searchHeld: boolean;
  /** This press of the key has done its work, or been cut off: nothing more until it is let go. */
  searchSpent: boolean;
  /** Container being searched, or null. */
  searchingId: number | null;
  searchLeft: number;
  /** Health at the last tick, so a hit shows up as a drop. */
  searchHealth: number;
}

/** Unaware, walking to a noise, or after a player. */
export type ZombieMode = 'wander' | 'alert' | 'hunt';

export interface ZombieState extends ZombieEntity {
  radius: number;
  speed: number;
  damage: number;
  points: number;
  reach: number;
  windupSec: number;
  cooldownSec: number;
  windupLeft: number;
  recoveryLeft: number;
  cooldownLeft: number;
  knockX: number;
  knockY: number;
  /** Seconds until another shove can stagger it. */
  staggerImmuneLeft: number;
  /** Seconds left steering sideways off an obstacle, and to which side. */
  sidestepLeft: number;
  sidestepSide: number;
  mode: ZombieMode;
  /** Part of the current horde: hunts without needing to see anyone, and never sleeps. */
  horde: boolean;
  /** Seconds of alert or hunt left without fresh contact. */
  interestLeft: number;
  /** Seconds until the next wander decision, and the heading; a zero heading is standing still. */
  wanderLeft: number;
  wanderX: number;
  wanderY: number;
  /** Building an unaware zombie stays inside, or null outdoors. */
  home: string | null;
  /** Spreads sight checks over the ticks. */
  senseOffset: number;
}

export interface BulletState extends BulletEntity {
  damage: number;
  rangeLeft: number;
  /** The zombie whose head was under the crosshair when this was fired. */
  headTarget?: ZombieState | null;
}

export interface PickupState extends PickupEntity {
  /** Seconds until it rots away; null for loot that stays until taken. */
  ttl: number | null;
  /** Rounds left in an ammo pickup, 0 for anything else. */
  rounds: number;
  /** What a found gun's last owner did to it. */
  quirk?: GunQuirk;
}

/** The van, once it has come. */
export interface ExitState {
  readonly x: number;
  readonly y: number;
  /** Seconds everyone on their feet has been at the van without a break. */
  hold: number;
}

export interface SimState {
  /** Every level's town follows from this. */
  readonly runSeed: number;
  /** Ammo, zombie speed and bite, horde size and lull length follow from this. */
  difficulty: DifficultyId;
  /** The current level's town. */
  map: WorldMap;
  readonly rng: Rng;
  /** Leads hunters to the players. */
  flow: FlowField;
  /** Leads alerted zombies to the latest gunfire. */
  noiseFlow: FlowField;
  readonly grid: SpatialHashGrid<ZombieState>;
  tick: number;
  runStartTick: number;
  phase: GamePhase;
  /** Level of the run, from 1. */
  level: number;
  /** Null until the level's last horde is survived. */
  exit: ExitState | null;
  /** Hordes survived in towns already left. */
  hordesBehind: number;
  /** Most recently started wave in this town, 0 before the first. */
  wave: number;
  intermissionLeft: number;
  /** Seconds until the current horde gives up. */
  hordeLeft: number;
  spawnQueue: ZombieType[];
  spawnTimer: number;
  /** Roaming zombies the town keeps topped up to. */
  populationTarget: number;
  topUpTimer: number;
  /** Noises since the noise field last refreshed. */
  noises: Point[];
  players: PlayerState[];
  /** Who left this run, by reconnect token, as they stood when they went. */
  departed: Map<string, PlayerState>;
  zombies: ZombieState[];
  bullets: BulletState[];
  pickups: PickupState[];
  /** At the same index as the town's container list. */
  containers: ContainerState[];
  events: GameEvent[];
  gameOver: GameOverStats | null;
  nextEntity: number;
  readonly workbench: WorkbenchMode;
  /** Set while the run is held at the workbench. */
  bench: BenchState | null;
}

export function entityId(sim: SimState, prefix: string): EntityId {
  sim.nextEntity += 1;
  return `${prefix}${sim.nextEntity}`;
}

export function emit(sim: SimState, event: GameEvent): void {
  sim.events.push(event);
}

export const alivePlayers = (sim: SimState): PlayerState[] => sim.players.filter((p) => p.status === 'alive');

/** Alive or downed, which is who keeps a run going. */
export const standingPlayers = (sim: SimState): PlayerState[] => sim.players.filter((p) => p.status !== 'dead');

/** This far from everyone and not in any building someone is standing in, a body can come or go unnoticed. */
export function hiddenFromEveryone(sim: SimState, spot: { x: number; y: number }, minDistance: number): boolean {
  const here = buildingAt(sim.map, spot.x, spot.y);
  return standingPlayers(sim).every((p) => {
    const farEnough = Math.hypot(p.x - spot.x, p.y - spot.y) >= minDistance;
    return farEnough && (here === null || p.indoors !== here.id);
  });
}

/** A random open spot in a ring around a point, or the point itself if the ring is all wall. */
export function openGroundNear(
  sim: SimState,
  x: number,
  y: number,
  minRadius: number,
  maxRadius: number,
  clearance: number,
): { x: number; y: number } {
  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = sim.rng() * Math.PI * 2;
    const distance = randRange(sim.rng, minRadius, maxRadius);
    const px = x + Math.cos(angle) * distance;
    const py = y + Math.sin(angle) * distance;
    const onMap = px > clearance && py > clearance && px < sim.map.width - clearance && py < sim.map.height - clearance;
    if (onMap && !isBlockedAt(sim.map, px, py) && !circleHitsSolid(sim.map, px, py, clearance)) return { x: px, y: py };
  }
  return { x, y };
}
