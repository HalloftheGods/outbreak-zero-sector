import { MEDKIT_MAX, PLAYER_RADIUS, WEAPONS } from '../../shared/constants.ts';
import { FlowField } from '../../shared/flow-field.ts';
import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type { BuildingInstance, ClientInputPacket, PickupEntity, PlayerEntity, SnapshotPacket, WeaponId, WorldMap, ZombieEntity } from '../../shared/protocol.ts';
import { buildingBox, doorBox, segmentHitsSolid } from '../../shared/world-map.ts';

const KEEP_AWAY = 70;
const ENGAGE = 170;

function nearestZombie(me: PlayerEntity, zombies: readonly ZombieEntity[]): ZombieEntity | null {
  let best: ZombieEntity | null = null;
  let bestDistance = Infinity;
  for (const z of zombies) {
    const distance = Math.hypot(z.x - me.x, z.y - me.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = z;
    }
  }
  return best;
}

/**
 * Circles the nearest threat and shoots it, the way a casual player kites:
 * back off inside KEEP_AWAY, orbit otherwise, collect anything lying about.
 * Stateful only in its orbit direction, which flips when it gets stuck.
 */
export class CirclingBot {
  private readonly id: string;
  private readonly map: WorldMap;
  private seq = 0;
  private orbit = 1;
  private lastX = 0;
  private lastY = 0;
  /** Guns seen fully empty, skipped until an ammo pickup. */
  private readonly drained = new Set<WeaponId>();

  constructor(id: string, map: WorldMap) {
    this.id = id;
    this.map = map;
  }

  private bestGun(me: PlayerEntity): WeaponId {
    const loaded = WEAPON_ORDER.filter((id) => me.owned.includes(id) && !this.drained.has(id));
    return loaded[loaded.length - 1];
  }

  private headFor(dirX: number, dirY: number, shoot: boolean, angle: number, me: PlayerEntity): ClientInputPacket {
    const dryMag = me.ammo === 0;
    if (dryMag && me.reserve === 0) this.drained.add(me.weapon);
    this.seq += 1;
    return {
      seq: this.seq,
      up: dirY < -0.3,
      down: dirY > 0.3,
      left: dirX < -0.3,
      right: dirX > 0.3,
      angle,
      shoot,
      reload: dryMag || (!shoot && me.ammo < me.magSize),
      weapon: this.bestGun(me),
      melee: false,
      heal: false,
    };
  }

  think(snapshot: SnapshotPacket): ClientInputPacket | null {
    const me = snapshot.players.find((p) => p.id === this.id);
    if (!me) return null;
    const restocked = snapshot.events.some((event) => event.type === 'pickup' && event.playerId === this.id);
    if (restocked) this.drained.clear();
    const stuck = me.moving && Math.hypot(me.x - this.lastX, me.y - this.lastY) < 0.5;
    if (stuck) this.orbit = -this.orbit;
    this.lastX = me.x;
    this.lastY = me.y;

    const target = nearestZombie(me, snapshot.zombies);
    const loot = snapshot.pickups.find((item) => Math.hypot(item.x - me.x, item.y - me.y) < 150);
    const distance = target ? Math.hypot(target.x - me.x, target.y - me.y) : Infinity;

    if (loot && distance > 60) {
      const angle = target ? Math.atan2(target.y - me.y, target.x - me.x) : me.angle;
      return this.headFor(loot.x - me.x, loot.y - me.y, target !== null && distance < WEAPONS[me.weapon].range, angle, me);
    }
    if (!target) return this.headFor(this.map.spawn.x - me.x, this.map.spawn.y - me.y, false, me.angle, me);

    const toX = (target.x - me.x) / distance;
    const toY = (target.y - me.y) / distance;
    const angle = Math.atan2(toY, toX);
    const lineClear = !segmentHitsSolid(this.map, me.x, me.y, target.x, target.y);
    const shoot = lineClear && distance < WEAPONS[me.weapon].range * 0.9;

    const orbitX = -toY * this.orbit;
    const orbitY = toX * this.orbit;
    if (distance < KEEP_AWAY) return this.headFor(orbitX - toX * 1.4, orbitY - toY * 1.4, shoot, angle, me);
    if (distance > ENGAGE) return this.headFor(orbitX + toX, orbitY + toY, shoot, angle, me);
    return this.headFor(orbitX, orbitY, shoot, angle, me);
  }
}

/** Fires only at what is about to reach it, with runners earning a longer leash. */
const WALKER_FIRE_RANGE = 70;
const RUNNER_FIRE_RANGE = 120;
const SHOVE_RANGE = 26;
const SHOVE_EVERY_TICKS = 22;
const HEAL_BELOW = 55;
const TICKS_BEFORE_UNSTICK = 45;

/** True if this item would do anything for the player right now. */
function wanted(me: PlayerEntity, item: PickupEntity): boolean {
  if (item.type === 'bandage') return me.health < me.maxHealth;
  if (item.type === 'medkit') return me.medkits < MEDKIT_MAX;
  if (item.type === 'pistol_ammo') return me.ammoBag.pistol < WEAPONS.pistol.reserveCap;
  if (item.type === 'carbine_ammo') return me.ammoBag.carbine < WEAPONS.carbine.reserveCap;
  if (item.type === 'shells') return me.ammoBag.shotgun < WEAPONS.shotgun.reserveCap;
  return !me.owned.includes(item.type);
}

/**
 * Plays the game as intended: walks building to building taking what it needs, keeps
 * moving through trouble, shoots only what is about to reach it, shoves when it can.
 */
export class ScavengerBot {
  private readonly id: string;
  private readonly map: WorldMap;
  private readonly nav: FlowField;
  private readonly searched = new Set<string>();
  private seq = 0;
  private tick = 0;
  private lastShove = -SHOVE_EVERY_TICKS;
  private goalKey = '';
  private lastX = 0;
  private lastY = 0;
  private stuckTicks = 0;
  private unstickX = 0;
  private unstickY = 0;
  private unstickLeft = 0;

  constructor(id: string, map: WorldMap) {
    this.id = id;
    this.map = map;
    this.nav = new FlowField(map);
  }

  private nearestBuilding(me: PlayerEntity): BuildingInstance | null {
    let best: BuildingInstance | null = null;
    let bestDistance = Infinity;
    for (const building of this.map.buildings) {
      if (this.searched.has(building.id)) continue;
      const door = doorBox(building);
      const distance = Math.hypot(door.x0 - me.x, door.y1 - me.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = building;
      }
    }
    return best;
  }

  private goal(me: PlayerEntity, snapshot: SnapshotPacket): { x: number; y: number; key: string } {
    if (me.indoors) this.searched.add(me.indoors);
    let loot: PickupEntity | null = null;
    let bestDistance = Infinity;
    for (const item of snapshot.pickups) {
      const distance = Math.hypot(item.x - me.x, item.y - me.y);
      if (wanted(me, item) && distance < bestDistance) {
        bestDistance = distance;
        loot = item;
      }
    }
    if (loot) return { x: loot.x, y: loot.y, key: loot.id };

    const building = this.nearestBuilding(me) ?? this.map.buildings[this.tick % this.map.buildings.length];
    if (this.searched.size >= this.map.buildings.length) this.searched.clear();
    const box = buildingBox(building);
    const door = doorBox(building);
    return { x: (door.x0 + door.x1) / 2, y: (box.y1 - 24), key: building.id };
  }

  private gunFor(me: PlayerEntity): WeaponId {
    const loaded = WEAPON_ORDER.filter((id) => me.owned.includes(id) && me.ammoBag[id] > 0);
    if (me.ammo > 0 || loaded.length === 0) return me.weapon;
    return loaded[loaded.length - 1];
  }

  private steer(me: PlayerEntity, goal: { x: number; y: number; key: string }): { x: number; y: number } {
    if (goal.key !== this.goalKey) {
      this.goalKey = goal.key;
      this.nav.recompute([goal]);
    }
    const moved = Math.hypot(me.x - this.lastX, me.y - this.lastY);
    this.lastX = me.x;
    this.lastY = me.y;
    this.stuckTicks = moved < 0.3 ? this.stuckTicks + 1 : 0;
    if (this.stuckTicks > TICKS_BEFORE_UNSTICK) {
      this.stuckTicks = 0;
      const angle = (this.tick * 2.399) % (Math.PI * 2);
      this.unstickX = Math.cos(angle);
      this.unstickY = Math.sin(angle);
      this.unstickLeft = 20;
    }
    if (this.unstickLeft > 0) {
      this.unstickLeft -= 1;
      return { x: this.unstickX, y: this.unstickY };
    }
    const waypoint = this.nav.nextWaypoint(me.x, me.y, PLAYER_RADIUS) ?? goal;
    return { x: waypoint.x - me.x, y: waypoint.y - me.y };
  }

  think(snapshot: SnapshotPacket): ClientInputPacket | null {
    const me = snapshot.players.find((p) => p.id === this.id);
    if (!me) return null;
    this.tick += 1;
    this.seq += 1;

    const target = nearestZombie(me, snapshot.zombies);
    const distance = target ? Math.hypot(target.x - me.x, target.y - me.y) : Infinity;
    const canHit = target !== null && !segmentHitsSolid(this.map, me.x, me.y, target.x, target.y);
    const reach = target?.type === 'runner' ? RUNNER_FIRE_RANGE : WALKER_FIRE_RANGE;
    const shoot = canHit && distance < reach && me.ammo > 0;
    const shove = canHit && distance < SHOVE_RANGE && this.tick - this.lastShove >= SHOVE_EVERY_TICKS;
    if (shove) this.lastShove = this.tick;

    let heading = this.steer(me, this.goal(me, snapshot));
    if (target && canHit && distance < 40) {
      // Backing off while the wind-up runs out beats walking through it.
      heading = { x: me.x - target.x, y: me.y - target.y };
    }
    const length = Math.hypot(heading.x, heading.y) || 1;
    const dirX = heading.x / length;
    const dirY = heading.y / length;
    return {
      seq: this.seq,
      up: dirY < -0.3,
      down: dirY > 0.3,
      left: dirX < -0.3,
      right: dirX > 0.3,
      angle: target ? Math.atan2(target.y - me.y, target.x - me.x) : Math.atan2(dirY, dirX),
      shoot,
      reload: me.ammo === 0 && me.reserve > 0,
      weapon: this.gunFor(me),
      melee: shove,
      heal: me.health < HEAL_BELOW && me.medkits > 0,
    };
  }
}

/** Stands where it spawned and never lets go of the trigger. */
export class TriggerBot {
  private readonly id: string;
  private seq = 0;

  constructor(id: string) {
    this.id = id;
  }

  think(snapshot: SnapshotPacket): ClientInputPacket | null {
    const me = snapshot.players.find((p) => p.id === this.id);
    if (!me) return null;
    this.seq += 1;
    const target = nearestZombie(me, snapshot.zombies);
    return {
      seq: this.seq,
      up: false,
      down: false,
      left: false,
      right: false,
      angle: target ? Math.atan2(target.y - me.y, target.x - me.x) : me.angle,
      shoot: true,
      reload: me.ammo === 0,
      weapon: null,
      melee: false,
      heal: false,
    };
  }
}
