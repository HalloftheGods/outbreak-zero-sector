import type { Container } from '../../shared/containers.ts';
import type {
  BulletEntity,
  EntityId,
  ExitEntity,
  GamePhase,
  PickupEntity,
  PlayerEntity,
  ZombieEntity,
} from '../../shared/protocol.ts';

export { CHEST_HEIGHT } from '../../shared/constants.ts';

/** Everything the renderer draws this frame. Plain values; nothing here is reactive. */
export interface SceneView {
  readonly players: readonly PlayerEntity[];
  readonly zombies: readonly ZombieEntity[];
  readonly bullets: readonly BulletEntity[];
  readonly pickups: readonly PickupEntity[];
  /** The van out of town, once it has come. */
  readonly exit: ExitEntity | null;
  /** Ids of the town's containers that have been opened. */
  readonly openedContainers: readonly number[];
  /** What the local player could search from where they stand, if anything. */
  readonly searchable: Container | null;
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
  exit: null,
  openedContainers: [],
  searchable: null,
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
