import { PLAYER_RADIUS, PLAYER_SPEED, TICK_DT } from '../../shared/constants.ts';
import { stepMovement } from '../../shared/movement.ts';
import type { EntityId, PlayerEntity, SnapshotPacket, WorldMap } from '../../shared/protocol.ts';
import { buildingAt, circleHitsSolid } from '../../shared/world-query.ts';
import type { SceneView } from '../engine/scene.ts';
import { LocalPredictor } from './prediction.ts';
import { extrapolateBullets, interpolatePlayers, interpolateZombies, SnapshotBuffer } from './snapshot-buffer.ts';

const MAX_BULLET_LEAD_SEC = 0.1;

export type WorldEntities = Pick<
  SceneView,
  'players' | 'zombies' | 'bullets' | 'pickups' | 'localId' | 'viewerId' | 'focusX' | 'focusY' | 'phase' | 'hostiles'
>;

/** What this client currently believes: buffered snapshots plus the predicted local player. */
export class ClientWorld {
  readonly localId: EntityId;
  readonly predictor: LocalPredictor;
  private readonly map: WorldMap;
  private readonly buffer = new SnapshotBuffer(TICK_DT * 1000);
  private latestArrival = 0;
  private predicting = false;

  constructor(map: WorldMap, localId: EntityId) {
    this.localId = localId;
    this.map = map;
    this.predictor = new LocalPredictor(
      (x, y, dirX, dirY, dt) => stepMovement(map, x, y, dirX, dirY, PLAYER_SPEED, dt, PLAYER_RADIUS),
      TICK_DT,
      (x, y) => circleHitsSolid(map, x, y, PLAYER_RADIUS),
    );
  }

  get latest(): SnapshotPacket | null {
    return this.buffer.latest?.snapshot ?? null;
  }

  /** The local player's entity as last reported by the sim. */
  get localPlayer(): PlayerEntity | null {
    return this.buffer.latest?.players.get(this.localId) ?? null;
  }

  /** A new run on the same connection. */
  restart(): void {
    this.buffer.clear();
    this.predicting = false;
  }

  push(snapshot: SnapshotPacket, nowMs: number): void {
    this.buffer.push(snapshot, nowMs);
    this.latestArrival = nowMs;
    const local = this.localPlayer;
    if (local?.status === 'alive' && this.predicting) {
      this.predictor.reconcile(local.x, local.y, local.lastInputSeq);
    }
  }

  /** The player the camera should sit on: yourself, or a teammate once you are dead. */
  private viewer(players: readonly PlayerEntity[], local: PlayerEntity): PlayerEntity {
    if (local.status !== 'dead') return local;
    return players.find((player) => player.status === 'alive')
      ?? players.find((player) => player.status === 'downed')
      ?? local;
  }

  /** Advances prediction by dt and returns this frame's entities, or null before any snapshot. */
  advance(nowMs: number, delayMs: number, dirX: number, dirY: number, aim: number, dt: number): WorldEntities | null {
    const newest = this.buffer.latest;
    const sample = this.buffer.sample(nowMs, delayMs);
    if (!newest || !sample) return null;

    const players = interpolatePlayers(sample);
    const local = newest.players.get(this.localId) ?? null;
    if (local) this.placeLocal(players, local, dirX, dirY, aim, dt, newest.snapshot.phase !== 'gameover');

    const shownLocal = players.find((player) => player.id === this.localId) ?? null;
    const viewer = shownLocal ? this.viewer(players, shownLocal) : players[0] ?? null;
    const lead = Math.min(MAX_BULLET_LEAD_SEC, Math.max(0, (nowMs - this.latestArrival) / 1000));
    return {
      players,
      zombies: interpolateZombies(sample),
      bullets: extrapolateBullets(newest.snapshot.bullets, lead),
      pickups: newest.snapshot.pickups,
      localId: this.localId,
      viewerId: viewer?.id ?? null,
      focusX: viewer?.x ?? 0,
      focusY: viewer?.y ?? 0,
      phase: newest.snapshot.phase,
      hostiles: newest.snapshot.hostiles,
    };
  }

  /** Swaps the delayed local entity for the predicted one, with the freshest stats. */
  private placeLocal(
    players: PlayerEntity[],
    local: PlayerEntity,
    dirX: number,
    dirY: number,
    aim: number,
    dt: number,
    running: boolean,
  ): void {
    const canMove = local.status === 'alive' && running;
    if (canMove) {
      if (!this.predicting) this.predictor.reset(local.x, local.y);
      this.predicting = true;
      this.predictor.advance(dirX, dirY, dt);
    } else {
      this.predicting = false;
      this.predictor.reset(local.x, local.y);
    }
    const index = players.findIndex((player) => player.id === this.localId);
    const moving = canMove && (dirX !== 0 || dirY !== 0);
    const { x, y } = this.predictor;
    // The room opens for where the player is shown; the sim will not say so for a few ticks yet.
    const indoors = buildingAt(this.map, x, y)?.id ?? null;
    const shown = { ...local, x, y, indoors, angle: canMove ? aim : local.angle, moving };
    if (index >= 0) players[index] = shown;
    else players.push(shown);
  }
}
