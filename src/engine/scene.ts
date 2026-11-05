import type {
  BulletEntity,
  EntityId,
  GamePhase,
  PickupEntity,
  PlayerEntity,
  ZombieEntity,
} from '../../shared/protocol.ts';

/**
 * Bodies collide on the ground, but people aim at chests. Aim, muzzle flashes
 * and tracers all sit this far above the ground point, so a shot passes through
 * the crosshair rather than just under it.
 */
export const CHEST_HEIGHT = 13;

/** Everything the renderer draws this frame. Plain values; nothing here is reactive. */
export interface SceneView {
  readonly players: readonly PlayerEntity[];
  readonly zombies: readonly ZombieEntity[];
  readonly bullets: readonly BulletEntity[];
  readonly pickups: readonly PickupEntity[];
  /** The player at this keyboard, if they exist yet. */
  readonly localId: EntityId | null;
  /** Whose eyes the camera is behind: localId, or a teammate when spectating. */
  readonly viewerId: EntityId | null;
  readonly focusX: number;
  readonly focusY: number;
  /** Buffer pixels, or null when the pointer is not steering the camera. */
  readonly pointerX: number | null;
  readonly pointerY: number | null;
  readonly showCrosshair: boolean;
  readonly phase: GamePhase;
  readonly hostiles: number;
}

export const EMPTY_SCENE: SceneView = {
  players: [],
  zombies: [],
  bullets: [],
  pickups: [],
  localId: null,
  viewerId: null,
  focusX: 0,
  focusY: 0,
  pointerX: null,
  pointerY: null,
  showCrosshair: false,
  phase: 'intermission',
  hostiles: 0,
};
