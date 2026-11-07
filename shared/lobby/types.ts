// What the Lobby knows about a room, and what a client is shown. Pure types: the Worker and the browser both import them.
import type { DifficultyId } from '../difficulty.ts';
import type { GameStyle } from '../game-style.ts';

/** Public rooms are listed and matched; private rooms are reached by code only. */
export type Visibility = 'public' | 'private';

/** Muster is the Arcade waiting screen; Campaign rooms wait in the bunker, which counts as playing. */
export type RoomPhase = 'muster' | 'playing' | 'over';

/** The host's coarse region, as Cloudflare reports it (request.cf.continent), or 'unknown'. */
export type Continent = 'AF' | 'AN' | 'AS' | 'EU' | 'NA' | 'OC' | 'SA' | 'unknown';

/** A phone host is ranked last: it runs the sim on a battery. */
export type HostDevice = 'desktop' | 'phone';

/** The Lobby's row for one room. Never leaves the Lobby whole: continent and seenAt stay inside. */
export interface RoomListing {
  readonly code: string;
  readonly protocol: number;
  readonly style: GameStyle;
  readonly difficulty: DifficultyId;
  readonly visibility: Visibility;
  readonly device: HostDevice;
  readonly continent: Continent;
  /** The level being played (Arcade) or the town being visited (Campaign). */
  readonly level: number;
  /** Campaign: the furthest level any survivor in the room has reached. Arcade rooms leave it at 1. */
  readonly highest: number;
  /** Survivors in the room now. */
  readonly seats: number;
  readonly maxSeats: number;
  /** Bit i set means survivor i is taken. */
  readonly taken: number;
  readonly phase: RoomPhase;
  readonly locked: boolean;
  readonly createdAt: number;
  /** When the room last proved it was alive. */
  readonly seenAt: number;
}

/** What a client may see of a room: no continent, no timestamps, and no callsign in a public room. */
export interface RoomCard {
  readonly code: string;
  readonly protocol: number;
  readonly style: GameStyle;
  readonly difficulty: DifficultyId;
  readonly visibility: Visibility;
  readonly level: number;
  readonly seats: number;
  readonly maxSeats: number;
  readonly taken: number;
  readonly phase: RoomPhase;
  readonly locked: boolean;
  /** The host's label. Only a private room carries one. */
  readonly hostLabel?: string;
}

/** One seat card on the Muster screen. */
export interface MusterSeat {
  readonly character: number;
  readonly ready: boolean;
  /** Free text in a private room; a public room labels the seat by survivor name instead. */
  readonly label?: string;
}

/** The JSON body of POST /v1/match. */
export interface MatchRequest {
  readonly protocol: number;
  readonly style: GameStyle;
  readonly difficulty: DifficultyId;
  readonly character: number;
  readonly highest?: number;
  /** Rooms to skip, newest first. At most MAX_AVOID. */
  readonly avoid?: readonly string[];
}

export const MAX_AVOID = 5;

/** The answer to POST /v1/match. */
export type MatchResult =
  | { readonly kind: 'join'; readonly code: string; readonly card: RoomCard }
  | { readonly kind: 'host'; readonly code: string; readonly hostKey: string }
  | { readonly kind: 'busy' };
