import { MEDKIT_MAX, PICKUP_RADIUS, WEAPONS } from '../../shared/constants.ts';
import type {
  BuildingKind,
  EntityId,
  GameEvent,
  PickupEntity,
  PickupType,
  PlayerEntity,
  WeaponId,
} from '../../shared/protocol.ts';
import type { Banner, PlaceBanner, UiState } from './hud-state.ts';

const BANNER_MS = 2600;
const PLACE_BANNER_MS = 2200;
/** A refused item on the floor says so once, and again only if the player lingers. */
const REFUSAL_REPEAT_MS = 2500;

const AMMO_GUN: Partial<Record<PickupType, WeaponId>> = {
  pistol_ammo: 'pistol',
  carbine_ammo: 'carbine',
  shells: 'shotgun',
};

const AMMO_NAME: Partial<Record<PickupType, string>> = {
  pistol_ammo: 'PISTOL AMMO',
  carbine_ammo: 'CARBINE AMMO',
  shells: 'SHELLS',
};

/** Too common to announce; the town map still ticks them off. */
const UNNAMED_PLACES: ReadonlySet<BuildingKind> = new Set<BuildingKind>(['house', 'apartment']);

export function isLandmark(kind: BuildingKind): boolean {
  return !UNNAMED_PLACES.has(kind);
}

/** Worded from what actually changed, since a pickup event does not carry an amount. */
export function pickupNote(pickup: PickupType, before: PlayerEntity | null, after: PlayerEntity | null): string {
  const gun = AMMO_GUN[pickup];
  if (gun) {
    const gained = (after?.ammoBag[gun] ?? 0) - (before?.ammoBag[gun] ?? 0);
    return gained > 0 ? `+${gained} ${AMMO_NAME[pickup]}` : `${AMMO_NAME[pickup]}`;
  }
  const isBandage = pickup === 'bandage';
  const isMedkit = pickup === 'medkit';
  if (isBandage) {
    const healed = Math.round((after?.health ?? 0) - (before?.health ?? 0));
    return healed > 0 ? `+${healed} HEALTH` : 'BANDAGE';
  }
  return isMedkit ? '+1 MEDKIT' : pickup.toUpperCase();
}

/** Why an item the player is standing on is still on the floor, or null if there is no such reason. */
export function refusalNote(player: PlayerEntity, type: PickupType): string | null {
  const gun = AMMO_GUN[type];
  const noRoomForAmmo = gun !== undefined && player.ammoBag[gun] >= WEAPONS[gun].reserveCap;
  const wastedBandage = type === 'bandage' && player.health >= player.maxHealth;
  const noRoomForMedkit = type === 'medkit' && player.medkits >= MEDKIT_MAX;
  if (noRoomForAmmo) return 'AMMO FULL';
  if (wastedBandage) return 'HEALTH FULL';
  return noRoomForMedkit ? 'MEDKITS FULL' : null;
}

/** The loud banner for a horde event, or null for anything else. */
export function hordeBanner(event: GameEvent): Omit<Banner, 'key'> | null {
  switch (event.type) {
    case 'wave_start': return { title: `HORDE ${event.wave}`, subtitle: `${event.hostiles} HOSTILES`, tone: 'danger' };
    case 'wave_clear': return { title: 'THE HORDE MOVES ON', subtitle: 'FOR NOW', tone: 'quiet' };
    default: return null;
  }
}

/** Banners, place labels and the words over the player's head: timing and wording, no drawing. */
export class RunNotices {
  private bannerKey = 0;
  private bannerUntilMs = 0;
  private placeKey = 0;
  private placeUntilMs = 0;
  private indoors: string | null = null;
  private refusedId: EntityId | null = null;
  private refusedAtMs = 0;

  reset(): void {
    this.bannerUntilMs = 0;
    this.placeUntilMs = 0;
    this.indoors = null;
    this.refusedId = null;
  }

  banner(banner: Omit<Banner, 'key'>, now: number): Banner {
    this.bannerKey += 1;
    this.bannerUntilMs = now + BANNER_MS;
    return { ...banner, key: this.bannerKey };
  }

  place(label: string, now: number): PlaceBanner {
    this.placeKey += 1;
    this.placeUntilMs = now + PLACE_BANNER_MS;
    return { key: this.placeKey, label };
  }

  /** The building id the player has just stepped into, or null if nothing changed. */
  entered(indoors: string | null): string | null {
    const changed = indoors !== this.indoors;
    this.indoors = indoors;
    return changed ? indoors : null;
  }

  /** The words to show, and where, if the player is standing on something they cannot take. */
  refusal(player: PlayerEntity, pickups: readonly PickupEntity[], now: number): string | null {
    const down = player.status !== 'alive';
    if (down) return null;
    for (const pickup of pickups) {
      const inReach = Math.hypot(pickup.x - player.x, pickup.y - player.y) <= PICKUP_RADIUS;
      const note = inReach ? refusalNote(player, pickup.type) : null;
      if (!note) continue;
      const fresh = pickup.id !== this.refusedId || now - this.refusedAtMs > REFUSAL_REPEAT_MS;
      if (!fresh) return null;
      this.refusedId = pickup.id;
      this.refusedAtMs = now;
      return note;
    }
    return null;
  }

  /** Clears whatever has run its time. */
  expired(ui: UiState, now: number): Partial<UiState> {
    const bannerDone = ui.banner !== null && now > this.bannerUntilMs;
    const placeDone = ui.place !== null && now > this.placeUntilMs;
    return { ...(bannerDone ? { banner: null } : {}), ...(placeDone ? { place: null } : {}) };
  }
}
