import type { EntityId, PlayerEntity, Stance, TileKind, WorldMap } from '../../shared/protocol.ts';
import { GROUND_EFFECTS, groundAt } from '../../shared/ground.ts';
import { playerSpeed } from '../../shared/players.ts';
import type { SfxName } from './sfx-registry.ts';
import type { PlayOpts } from './mixer.ts';

/** Which footstep a surface sounds like. Floors, roads and anything off the map are plain. */
export function stepSfxFor(kind: TileKind | null): SfxName {
  return (kind && SURFACE_STEP[kind]) || 'step_hard';
}

const SURFACE_STEP: Readonly<Partial<Record<TileKind, SfxName>>> = {
  grass: 'step_soft',
  dirt: 'step_soft',
  water: 'step_water',
  snow: 'step_snow',
  sludge: 'step_sludge',
  ash: 'step_ash',
};

/** Slow enough to be sneaking, fast enough to be sprinting, or neither. */
function stanceBySpeed(ratio: number): Stance {
  if (ratio < SNEAK_BELOW) return 'sneak';
  return ratio > SPRINT_ABOVE ? 'sprint' : 'walk';
}

/** World pixels between steps. Sneaking takes short, rare steps; sprinting long, quick ones. */
const STRIDE: Record<Stance, number> = { sneak: 40, walk: 26, sprint: 30 };
/** Steps stay low so they never mask gunfire or groans; sneaking is barely there. */
const STEP_GAIN: Record<Stance, number> = { sneak: 0.3, walk: 0.8, sprint: 1.1 };
/** Measured speed, as a share of that player's walk, that separates the stances. */
const SNEAK_BELOW = 0.78;
const SPRINT_ABOVE = 1.15;
/** A move this many times a sprint's pace is a teleport or a respawn, not a stride. */
const TELEPORT_RATIO = 3 * 1.4;

export type StepPlayer = (name: SfxName, opts: PlayOpts) => void;

interface Walker {
  x: number;
  y: number;
  /** Distance walked since the last step. */
  acc: number;
  /** Frame this walker was last seen on, to drop the ones who left. */
  seen: number;
}

/** Turns where players are, frame to frame, into footsteps on the ground under them. */
export class FootstepTracker {
  private readonly walkers = new Map<EntityId, Walker>();
  private frame = 0;

  /**
   * One frame. Stance is read from how fast a player actually moved, undone for the ground's drag, so
   * the local player and everyone else are treated alike. Positions are the rendered, interpolated ones.
   * The local player's own steps are never attenuated; the rest fall off with distance in the mixer.
   */
  tick(players: readonly PlayerEntity[], localId: EntityId | null, map: WorldMap, dt: number, play: StepPlayer): void {
    this.frame += 1;
    for (const p of players) this.step(p, p.id === localId, map, dt, play);
    if (this.walkers.size > players.length) this.drop();
  }

  reset(): void {
    this.walkers.clear();
  }

  private step(p: PlayerEntity, local: boolean, map: WorldMap, dt: number, play: StepPlayer): void {
    let w = this.walkers.get(p.id);
    if (!w) {
      w = { x: p.x, y: p.y, acc: 0, seen: this.frame };
      this.walkers.set(p.id, w);
    }
    w.seen = this.frame;
    const dist = Math.hypot(p.x - w.x, p.y - w.y);
    w.x = p.x;
    w.y = p.y;
    if (p.status !== 'alive' || dt <= 0) {
      w.acc = 0;
      return;
    }
    if (dist === 0) return;
    const kind = groundAt(map, p.x, p.y);
    const drag = (kind && GROUND_EFFECTS[kind]?.speed) || 1;
    const ratio = dist / dt / (playerSpeed(p.skin) * drag);
    if (ratio > TELEPORT_RATIO) {
      w.acc = 0;
      return;
    }
    const stance = stanceBySpeed(ratio);
    w.acc = Math.min(w.acc + dist, STRIDE[stance] * 2);
    if (w.acc < STRIDE[stance]) return;
    w.acc -= STRIDE[stance];
    play(stepSfxFor(kind), local ? { local: true, gain: STEP_GAIN[stance] } : { x: p.x, y: p.y, gain: STEP_GAIN[stance] });
  }

  private drop(): void {
    for (const [id, w] of this.walkers) if (w.seen !== this.frame) this.walkers.delete(id);
  }
}
