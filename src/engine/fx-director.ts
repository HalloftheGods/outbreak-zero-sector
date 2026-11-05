import { MUZZLE_OFFSET } from '../../shared/constants.ts';
import type { EntityId, GameEvent, PickupType, WeaponId, ZombieType } from '../../shared/protocol.ts';
import { dirFromAngle } from '../art/types.ts';
import type { ArtBook, PixelSprite } from '../art/types.ts';
import { barrelOffset } from './barrel.ts';
import { ParticleSystem } from './particles.ts';
import { CHEST_HEIGHT } from './scene.ts';
import type { ScreenEffects } from './screen-effects.ts';
import type { VisualStore } from './visuals.ts';

const HIT_FLASH_SEC = 0.09;
const BLOOD = ['#8c1a14', '#a8231a', '#5e100c'];
const ACID = ['#a9d94a', '#6d9c22', '#d4f07a'];
const SPARK = ['#fff0b8', '#ffc04a', '#ff8e2e'];
const SKULL_CHIPS = ['#e4dcc3', '#c9bd9c', '#a8231a'];
const HEADSHOT_COLOR = '#ff5a3c';
/** The word goes over the head it names. */
const HEADSHOT_NOTE_GAP = 10;
const HEADSHOT_KICK = 0.22;
const SCORE_COLOR = '#e8a33d';
const PICKUP_COLOR = '#b6d65a';
const REFUSED_COLOR = '#d9b98a';
/** Notices sit over the head, not on the ground at the feet. */
const NOTE_HEIGHT = 26;
const SHOVE_HIT_KICK = 0.4;

const MUZZLE_LIGHT: Record<WeaponId, { radius: number; life: number }> = {
  pistol: { radius: 64, life: 0.06 },
  carbine: { radius: 72, life: 0.05 },
  shotgun: { radius: 110, life: 0.1 },
};

const SHOT_KICK: Record<WeaponId, number> = { pistol: 0.16, carbine: 0.12, shotgun: 0.42 };

const PICKUP_LABEL: Record<PickupType, string> = {
  bandage: 'BANDAGE',
  medkit: 'MEDKIT',
  pistol_ammo: 'PISTOL AMMO',
  carbine_ammo: 'CARBINE AMMO',
  shells: 'SHELLS',
  carbine: 'CARBINE',
  shotgun: 'SHOTGUN',
  knife: 'KNIFE',
  barrel: 'BARREL',
  grip: 'GRIP',
  magazine: 'MAGAZINE',
  suppressor: 'SUPPRESSOR',
  toolkit: 'TOOLKIT',
};

export interface PulseLight {
  x: number;
  y: number;
  radius: number;
  color: string;
  life: number;
  readonly maxLife: number;
}

/** Where the viewer's own body is right now, ahead of what the server has reported. */
export interface FxContext {
  readonly localId: EntityId | null;
  readonly localX: number;
  readonly localY: number;
  readonly time: number;
  /** What the local player just took, worded with the amount, for a pickup event. */
  readonly pickupNote?: string;
}

export interface FxHooks {
  stamp(sprite: PixelSprite, x: number, y: number, alpha?: number): void;
  addCorpse(id: EntityId, type: ZombieType, x: number, y: number): void;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function spread(amount: number): number {
  return (Math.random() - 0.5) * 2 * amount;
}

/** Turns sim events into everything visual that follows from them. */
export class FxDirector {
  readonly particles: ParticleSystem;
  readonly pulses: PulseLight[] = [];
  private readonly art: ArtBook;
  private readonly visuals: VisualStore;
  private readonly effects: ScreenEffects;
  private readonly hooks: FxHooks;

  constructor(art: ArtBook, visuals: VisualStore, effects: ScreenEffects, hooks: FxHooks) {
    this.art = art;
    this.visuals = visuals;
    this.effects = effects;
    this.hooks = hooks;
    this.particles = new ParticleSystem((sprite, x, y) => hooks.stamp(sprite, x, y));
  }

  clear(): void {
    this.particles.clear();
    this.pulses.length = 0;
  }

  update(dt: number): void {
    this.particles.update(dt);
    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      this.pulses[i].life -= dt;
      if (this.pulses[i].life <= 0) this.pulses.splice(i, 1);
    }
  }

  handle(event: GameEvent, ctx: FxContext): void {
    switch (event.type) {
      case 'shot': this.onShot(event, ctx); break;
      case 'melee': this.onMelee(event, ctx); break;
      case 'heal': this.onHeal(event, ctx); break;
      case 'bullet_impact': this.onImpact(event.x, event.y, event.angle); break;
      case 'zombie_hit': this.onZombieHit(event.zombieId, event.x, event.y, event.angle, ctx.time); break;
      case 'headshot': this.onHeadshot(event, ctx); break;
      case 'zombie_die': this.onZombieDie(event, ctx); break;
      case 'bloater_burst': this.onBurst(event.x, event.y, event.radius); break;
      case 'player_hurt': this.onPlayerHurt(event.playerId, event.x, event.y, event.damage, ctx); break;
      case 'player_downed': this.stampBlood(event.x, event.y); break;
      case 'player_revived': this.particles.addText('REVIVED', event.x, event.y - 14, PICKUP_COLOR); break;
      case 'pickup': this.onPickup(event, ctx); break;
      case 'container_opened': this.onContainerOpened(event, ctx); break;
      default: break;
    }
  }

  private onShot(event: Extract<GameEvent, { type: 'shot' }>, ctx: FxContext): void {
    const isLocal = event.playerId === ctx.localId;
    const dirX = Math.cos(event.angle);
    const dirY = Math.sin(event.angle);
    // Shot events report the barrel on the ground plane; the body is what the art hangs from.
    const bodyX = isLocal ? ctx.localX : event.x - dirX * MUZZLE_OFFSET;
    const bodyY = isLocal ? ctx.localY : event.y - dirY * MUZZLE_OFFSET;
    const dir = dirFromAngle(event.angle);
    const barrel = barrelOffset(event.weapon, dir);
    const tipX = bodyX + barrel.x;
    const shooter = this.visuals.get(event.playerId);
    const tipY = bodyY + barrel.y + shooter.gunDrop;
    shooter.fireAt = ctx.time;

    this.particles.addClip(this.art.fx.muzzle[event.weapon][dir], tipX, tipY, true);
    const light = MUZZLE_LIGHT[event.weapon];
    this.pulses.push({ x: tipX, y: bodyY, radius: light.radius, color: '#ffd28a', life: light.life, maxLife: light.life });
    this.ejectCasing(event.weapon, bodyX + dirX * 4, bodyY + dirY * 4, dirX, dirY);
    if (event.weapon === 'shotgun') this.particles.addClip(this.art.fx.smokePuff, tipX, tipY, false);
    if (isLocal) this.effects.addShake(SHOT_KICK[event.weapon]);
  }

  private onMelee(event: Extract<GameEvent, { type: 'melee' }>, ctx: FxContext): void {
    this.visuals.get(event.playerId).meleeAt = ctx.time;
    const landedHere = event.hit && event.playerId === ctx.localId;
    if (landedHere) this.effects.addShake(SHOVE_HIT_KICK);
  }

  private onHeal(event: Extract<GameEvent, { type: 'heal' }>, ctx: FxContext): void {
    const isLocal = event.playerId === ctx.localId;
    const x = isLocal ? ctx.localX : event.x;
    const y = isLocal ? ctx.localY : event.y;
    this.particles.addText(`+${Math.round(event.amount)} HEALTH`, x, y - NOTE_HEIGHT, PICKUP_COLOR);
  }

  private ejectCasing(weapon: WeaponId, x: number, y: number, dirX: number, dirY: number): void {
    const sprite = weapon === 'shotgun' ? this.art.fx.shotgunShell : this.art.fx.shellCasing;
    const side = 34 + Math.random() * 24;
    this.particles.addCasing({
      x,
      y,
      z: CHEST_HEIGHT,
      vx: -dirY * side - dirX * 10 + spread(8),
      vy: dirX * side - dirY * 10 + spread(8),
      vz: 46 + Math.random() * 24,
      sprite,
      bounces: 0,
    });
  }

  private onImpact(x: number, y: number, angle: number): void {
    this.particles.addClip(this.art.fx.bulletImpact, x, y - CHEST_HEIGHT, true);
    this.burstDots(x, y, angle + Math.PI, SPARK, 5, 70, true);
  }

  private onZombieHit(id: EntityId, x: number, y: number, angle: number, time: number): void {
    this.visuals.get(id).flashUntil = time + HIT_FLASH_SEC;
    this.particles.addClip(this.art.fx.bloodBurst, x, y - CHEST_HEIGHT, false);
    this.burstDots(x, y, angle, BLOOD, 6, 60, false);
    if (Math.random() < 0.35) this.stampBlood(x + spread(6), y + spread(6));
  }

  /** The event is at the head as drawn, and dots start CHEST_HEIGHT over the spot they are given. */
  private onHeadshot(event: Extract<GameEvent, { type: 'headshot' }>, ctx: FxContext): void {
    const { x, y, angle } = event;
    const groundY = y + CHEST_HEIGHT;
    this.particles.addClip(this.art.fx.bloodBurst, x, y, false);
    this.burstDots(x, groundY, angle, BLOOD, 12, 110, false, 1.1);
    this.burstDots(x, groundY, angle, SKULL_CHIPS, 6, 140, false, 1.1);
    const shotHere = event.playerId === ctx.localId;
    if (!shotHere) return;
    this.particles.addText(`HEADSHOT +${event.points}`, x, y - HEADSHOT_NOTE_GAP, HEADSHOT_COLOR);
    this.effects.addShake(HEADSHOT_KICK);
  }

  private onZombieDie(event: Extract<GameEvent, { type: 'zombie_die' }>, ctx: FxContext): void {
    const { x, y, angle } = event;
    this.hooks.addCorpse(event.zombieId, event.zombieType, x, y);
    this.burstDots(x, y, angle, BLOOD, 14, 80, false);
    this.stampBlood(x, y);
    this.stampBlood(x + Math.cos(angle) * 9, y + Math.sin(angle) * 9);
    if (event.killerId === ctx.localId && event.points > 0) {
      this.particles.addText(`+${event.points}`, x, y - 16, SCORE_COLOR);
    }
  }

  private onBurst(x: number, y: number, radius: number): void {
    const fx = this.art.fx;
    this.particles.addClip(fx.acidBurst, x, y, true);
    this.particles.addClip(fx.smokePuff, x + spread(10), y - 6 + spread(6), false);
    this.particles.addClip(fx.smokePuff, x + spread(14), y - 4 + spread(8), false);
    this.burstDots(x, y, 0, ACID, 34, 150, true, Math.PI);
    for (let i = 0; i < 6; i += 1) {
      const spot = Math.random() * Math.PI * 2;
      const reach = Math.random() * radius * 0.7;
      this.hooks.stamp(pick(fx.acidDecals), x + Math.cos(spot) * reach, y + Math.sin(spot) * reach);
    }
    this.pulses.push({ x, y, radius: radius * 3.2, color: '#b6f060', life: 0.34, maxLife: 0.34 });
    this.effects.addShake(0.75);
  }

  private onPlayerHurt(id: EntityId, x: number, y: number, damage: number, ctx: FxContext): void {
    this.visuals.get(id).flashUntil = ctx.time + HIT_FLASH_SEC;
    this.burstDots(x, y, -Math.PI / 2, BLOOD, 7, 50, false, Math.PI);
    if (id === ctx.localId) {
      this.effects.addHurt(0.35 + damage / 40);
      this.effects.addShake(0.32);
    }
  }

  private onPickup(event: Extract<GameEvent, { type: 'pickup' }>, ctx: FxContext): void {
    const isLocal = event.playerId === ctx.localId;
    const x = isLocal ? ctx.localX : event.x;
    const y = isLocal ? ctx.localY : event.y;
    const label = isLocal && ctx.pickupNote ? ctx.pickupNote : PICKUP_LABEL[event.pickup];
    this.particles.addText(label, x, y - NOTE_HEIGHT, PICKUP_COLOR);
    this.pulses.push({ x: event.x, y: event.y, radius: 30, color: '#d8c89a', life: 0.18, maxLife: 0.18 });
  }

  /** Whoever hears a clatter sees where it came from; only the searcher is told they found nothing. */
  private onContainerOpened(event: Extract<GameEvent, { type: 'container_opened' }>, ctx: FxContext): void {
    const emptyHanded = !event.found && event.playerId === ctx.localId;
    if (event.noisy) this.particles.addText('CLATTER', event.x, event.y - NOTE_HEIGHT, SCORE_COLOR);
    else if (emptyHanded) this.note('NOTHING', event.x, event.y);
  }

  /** Over the local player's head, for what the sim says nothing about: an item left where it lay. */
  note(text: string, x: number, y: number): void {
    this.particles.addText(text, x, y - NOTE_HEIGHT, REFUSED_COLOR);
  }

  private stampBlood(x: number, y: number): void {
    this.hooks.stamp(pick(this.art.fx.bloodDecals), x, y);
  }

  private burstDots(
    x: number,
    y: number,
    angle: number,
    colors: readonly string[],
    count: number,
    speed: number,
    emissive: boolean,
    arc = 0.7,
  ): void {
    for (let i = 0; i < count; i += 1) {
      const heading = angle + spread(arc);
      const pace = speed * (0.35 + Math.random() * 0.65);
      this.particles.addDot({
        x,
        y,
        z: CHEST_HEIGHT,
        vx: Math.cos(heading) * pace,
        vy: Math.sin(heading) * pace,
        vz: 30 + Math.random() * 50,
        life: 0.3 + Math.random() * 0.35,
        color: pick(colors),
        size: Math.random() < 0.25 ? 2 : 1,
        emissive,
      });
    }
  }
}
