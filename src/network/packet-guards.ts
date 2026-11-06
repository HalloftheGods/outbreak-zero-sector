import { isDifficultyId } from '../../shared/difficulty.ts';
import { PART_ORDER } from '../../shared/gun-upgrade-data.ts';
import { WEAPON_ORDER } from '../../shared/protocol.ts';
import { EFFECT_ORDER, KIT_ORDER } from '../../shared/round-effect-data.ts';
import type {
  BulletEntity,
  ExitEntity,
  GameEvent,
  GameOverStats,
  PickupEntity,
  PlayerEntity,
  ServerPacket,
  SnapshotPacket,
  TrackEntity,
  WelcomePacket,
  ZombieEntity,
} from '../../shared/protocol.ts';
import { isBenchView, isPlayerGear } from './bench-guards.ts';

type Fields = Record<string, unknown>;

const STATUSES: readonly unknown[] = ['alive', 'downed', 'dead'];
const PHASES: readonly unknown[] = ['intermission', 'wave', 'gameover'];
const OUTCOMES: readonly unknown[] = ['defeat', 'victory'];
const ZOMBIE_TYPES: readonly unknown[] = ['walker', 'runner', 'bloater', 'brute', 'screamer'];
const PICKUP_TYPES: readonly unknown[] = ['bandage', 'medkit', 'pistol_ammo', 'carbine_ammo', 'shells', 'carbine', 'shotgun', 'knife', 'radio', ...PART_ORDER, ...KIT_ORDER];
const WEAPONS: readonly unknown[] = WEAPON_ORDER;
const EFFECTS: readonly unknown[] = EFFECT_ORDER;
const EVENT_TYPES: ReadonlySet<unknown> = new Set([
  'shot', 'dry_fire', 'melee', 'heal', 'zombie_alert', 'zombie_track', 'reload_start', 'reload_end', 'weapon_switch', 'bullet_impact',
  'zombie_hit', 'zombie_status', 'headshot', 'zombie_die', 'zombie_attack', 'bloater_burst', 'player_hurt',
  'player_downed', 'player_revived', 'player_dead', 'pickup', 'container_opened', 'bottle_smash', 'car_alarm', 'wave_intermission',
  'wave_start', 'wave_clear', 'exit_open', 'level_complete', 'level_start', 'game_over',
]);

const isFields = (v: unknown): v is Fields => typeof v === 'object' && v !== null;
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isFlag = (v: unknown): boolean => v === undefined || typeof v === 'boolean';

function hasNumbers(v: Fields, keys: readonly string[]): boolean {
  return keys.every((key) => isNumber(v[key]));
}

export function isPlayerEntity(v: unknown): v is PlayerEntity {
  return isFields(v)
    && isString(v.id)
    && isString(v.name)
    && typeof v.moving === 'boolean'
    && typeof v.knife === 'boolean'
    && STATUSES.includes(v.status)
    && WEAPONS.includes(v.weapon)
    && Array.isArray(v.owned)
    && v.owned.every((weapon) => WEAPONS.includes(weapon))
    && isFields(v.ammoBag)
    && hasNumbers(v.ammoBag, WEAPON_ORDER)
    && isFields(v.mags)
    && hasNumbers(v.mags, WEAPON_ORDER)
    && (v.indoors === null || isString(v.indoors))
    && (v.gear === undefined || isPlayerGear(v.gear))
    && (v.bottles === undefined || isNumber(v.bottles))
    && hasNumbers(v, [
      'skin', 'x', 'y', 'angle', 'health', 'maxHealth', 'ammo', 'magSize', 'reserve', 'medkits',
      'reload', 'search', 'bleedout', 'revive', 'score', 'kills', 'lastInputSeq',
    ]);
}

export function isZombieEntity(v: unknown): v is ZombieEntity {
  return isFields(v)
    && isString(v.id)
    && ZOMBIE_TYPES.includes(v.type)
    && typeof v.attacking === 'boolean'
    && isFlag(v.burning)
    && isFlag(v.slowed)
    && isFlag(v.tracking)
    && (v.corrosion === undefined || isNumber(v.corrosion))
    && hasNumbers(v, ['x', 'y', 'angle', 'health', 'maxHealth']);
}

export function isTrackEntity(v: unknown): v is TrackEntity {
  return isFields(v) && hasNumbers(v, ['x', 'y', 'angle', 'left']);
}

export function isBulletEntity(v: unknown): v is BulletEntity {
  return isFields(v)
    && isString(v.id)
    && isString(v.shooterId)
    && (v.effect === undefined || EFFECTS.includes(v.effect))
    && hasNumbers(v, ['x', 'y', 'vx', 'vy']);
}

export function isPickupEntity(v: unknown): v is PickupEntity {
  return isFields(v)
    && isString(v.id)
    && PICKUP_TYPES.includes(v.type)
    && hasNumbers(v, ['x', 'y']);
}

/** Coarse on purpose: the consumers switch on type and skip what they do not know. */
export function isGameEvent(v: unknown): v is GameEvent {
  if (!isFields(v) || !EVENT_TYPES.has(v.type)) return false;
  return !('x' in v) || (isNumber(v.x) && isNumber(v.y));
}

export function isExitEntity(v: unknown): v is ExitEntity {
  return isFields(v) && hasNumbers(v, ['x', 'y', 'progress']);
}

export function isGameOverStats(v: unknown): v is GameOverStats {
  return isFields(v)
    && OUTCOMES.includes(v.outcome)
    && isDifficultyId(v.difficulty)
    && hasNumbers(v, ['level', 'wave', 'durationSec'])
    && Array.isArray(v.players)
    && v.players.every((p) => isFields(p)
      && isString(p.id)
      && isString(p.name)
      && hasNumbers(p, ['skin', 'kills', 'score']));
}

export function isWelcomePacket(v: unknown): v is WelcomePacket {
  return isFields(v)
    && v.type === 'welcome'
    && isString(v.yourId)
    && hasNumbers(v, ['tickRate', 'mapSeed'])
    && (v.difficulty === undefined || isDifficultyId(v.difficulty));
}

export function isSnapshotPacket(v: unknown): v is SnapshotPacket {
  return isFields(v)
    && v.type === 'snapshot'
    && PHASES.includes(v.phase)
    && hasNumbers(v, ['tick', 'level', 'mapSeed', 'wave', 'intermission', 'hostiles'])
    && Array.isArray(v.players) && v.players.every(isPlayerEntity)
    && Array.isArray(v.zombies) && v.zombies.every(isZombieEntity)
    && Array.isArray(v.bullets) && v.bullets.every(isBulletEntity)
    && Array.isArray(v.pickups) && v.pickups.every(isPickupEntity)
    && (v.exit === null || isExitEntity(v.exit))
    && Array.isArray(v.openedContainers)
    && v.openedContainers.every(isNumber)
    && (v.tracks === undefined || (Array.isArray(v.tracks) && v.tracks.every(isTrackEntity)))
    && Array.isArray(v.events) && v.events.every(isGameEvent)
    && (v.gameOver === null || isGameOverStats(v.gameOver))
    && (v.bench === undefined || isBenchView(v.bench));
}

/** Returns null for anything that is not a well-formed server packet. */
export function parseServerPacket(raw: unknown): ServerPacket | null {
  if (!isString(raw)) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (isSnapshotPacket(value) || isWelcomePacket(value)) return value;
  if (isFields(value) && value.type === 'player_disconnected' && isString(value.playerId)) {
    return { type: 'player_disconnected', playerId: value.playerId };
  }
  return null;
}
