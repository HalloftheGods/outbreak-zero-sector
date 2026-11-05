import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type {
  EntityId,
  GameOverStats,
  GamePhase,
  PlayerEntity,
  PlayerStatus,
  SnapshotPacket,
  WeaponId,
} from '../../shared/protocol.ts';
import type { ArtBook } from '../art/types.ts';
import type { TransportKind } from '../network/transport.ts';
import type { BestRun } from './storage.ts';

export type Screen = 'title' | 'game' | 'gameover' | 'lost';

/** At or under this many rounds across every gun, the HUD starts to warn. */
const LOW_AMMO_ROUNDS = 10;

/** The title's co-op address box, where Enter means connect. */
export const SERVER_FIELD_ID = 'server';

export interface TeammateHud {
  readonly id: EntityId;
  readonly name: string;
  readonly health: number;
  readonly maxHealth: number;
  readonly status: PlayerStatus;
}

export interface HudState {
  readonly health: number;
  readonly maxHealth: number;
  readonly status: PlayerStatus;
  readonly weapon: WeaponId;
  readonly owned: readonly WeaponId[];
  readonly ammo: number;
  readonly magSize: number;
  readonly reserve: number;
  readonly ammoBag: Readonly<Record<WeaponId, number>>;
  readonly mags: Readonly<Record<WeaponId, number>>;
  readonly medkits: number;
  readonly reload: number;
  readonly score: number;
  readonly kills: number;
  readonly bleedout: number;
  readonly revive: number;
  readonly phase: GamePhase;
  readonly wave: number;
  readonly intermission: number;
  readonly hostiles: number;
  readonly teammates: readonly TeammateHud[];
  /** Who the camera is on, when that is not you. */
  readonly spectating: string | null;
}

export interface Banner {
  /** Changes with every banner, so the component replays its entrance. */
  readonly key: number;
  readonly title: string;
  readonly subtitle: string;
  /** 'quiet' is for a horde moving on: nothing here is ever safe, so it gets no green. */
  readonly tone: 'danger' | 'quiet';
}

/** A small label for the place the player just walked into. */
export interface PlaceBanner {
  readonly key: number;
  readonly label: string;
}

export interface RunResult {
  readonly stats: GameOverStats;
  readonly localId: EntityId;
  readonly score: number;
  readonly kills: number;
  readonly isNewBest: boolean;
}

/** Small, plain and replaced whole; the only game state Vue ever sees. */
export interface UiState {
  readonly screen: Screen;
  readonly art: ArtBook | null;
  readonly mode: TransportKind;
  readonly connecting: boolean;
  readonly error: string | null;
  readonly paused: boolean;
  readonly mapOpen: boolean;
  readonly hud: HudState | null;
  readonly banner: Banner | null;
  readonly place: PlaceBanner | null;
  readonly result: RunResult | null;
  readonly restarting: boolean;
  readonly lostReason: string;
  readonly signalWeak: boolean;
  readonly best: BestRun | null;
  readonly callsign: string;
  readonly serverAddress: string;
  readonly volume: number;
  readonly muted: boolean;
}

export function buildHud(snapshot: SnapshotPacket, local: PlayerEntity, spectating: string | null): HudState {
  return {
    health: local.health,
    maxHealth: local.maxHealth,
    status: local.status,
    weapon: local.weapon,
    owned: local.owned,
    ammo: local.ammo,
    magSize: local.magSize,
    reserve: local.reserve,
    ammoBag: local.ammoBag,
    mags: local.mags,
    medkits: local.medkits,
    reload: local.reload,
    score: local.score,
    kills: local.kills,
    bleedout: local.bleedout,
    revive: local.revive,
    phase: snapshot.phase,
    wave: snapshot.wave,
    intermission: snapshot.intermission,
    hostiles: snapshot.hostiles,
    teammates: snapshot.players
      .filter((player) => player.id !== local.id)
      .map(({ id, name, health, maxHealth, status }) => ({ id, name, health, maxHealth, status })),
    spectating,
  };
}

export type AmmoState = 'ok' | 'low' | 'empty';

type Loadout = Pick<HudState, 'owned' | 'ammoBag' | 'mags'>;

/** All a gun can still fire: what is loaded plus what is spare. */
export function gunRounds(hud: Pick<HudState, 'ammoBag' | 'mags'>, weapon: WeaponId): number {
  return hud.mags[weapon] + hud.ammoBag[weapon];
}

/** 'empty' means nothing left in any gun, not just a magazine to refill or a gun to swap. */
export function ammoState(hud: Loadout): AmmoState {
  const rounds = hud.owned.reduce((sum, weapon) => sum + gunRounds(hud, weapon), 0);
  const allDry = rounds === 0;
  if (allDry) return 'empty';
  return rounds <= LOW_AMMO_ROUNDS ? 'low' : 'ok';
}

/** The number key of a gun with rounds, when the one in hand has none, or null. */
export function switchKey(hud: Loadout & Pick<HudState, 'weapon'>): number | null {
  const inHandFires = gunRounds(hud, hud.weapon) > 0;
  if (inHandFires) return null;
  const loaded = WEAPON_ORDER.findIndex((weapon) => hud.owned.includes(weapon) && gunRounds(hud, weapon) > 0);
  return loaded < 0 ? null : loaded + 1;
}

export interface HordeStatus {
  readonly title: string;
  readonly detail: string;
  /** A horde is on the street, as opposed to the quiet between them. */
  readonly loud: boolean;
}

export function hordeStatus(hud: Pick<HudState, 'phase' | 'wave' | 'intermission' | 'hostiles'>): HordeStatus {
  const runOver = hud.phase === 'gameover';
  if (runOver) return { title: 'Game over', detail: '', loud: true };
  const hunted = hud.phase === 'wave';
  if (hunted) {
    return { title: `Horde ${hud.wave}`, detail: `${hud.hostiles} hostile${hud.hostiles === 1 ? '' : 's'} left`, loud: true };
  }
  return { title: `Horde in ${formatDuration(Math.ceil(hud.intermission))}`, detail: '', loud: false };
}

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, '0')}`;
}
