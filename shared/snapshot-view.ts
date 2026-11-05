import { VIEWER_RANGE } from './constants.ts';
import type { EntityId, PlayerEntity, SnapshotPacket } from './protocol.ts';

/**
 * One client's cut of a frame: zombies and pickups around them, everyone in the room, and every
 * event. A dead player's camera sits on a teammate, so they get what the whole room can see.
 */
export function viewFor(frame: SnapshotPacket, viewerId: EntityId): SnapshotPacket {
  const viewer = frame.players.find((p) => p.id === viewerId);
  const watchingOthers = !viewer || viewer.status === 'dead';
  const eyes: readonly PlayerEntity[] = watchingOthers ? frame.players : [viewer];
  const inView = (item: { x: number; y: number }): boolean =>
    eyes.some((p) => Math.hypot(p.x - item.x, p.y - item.y) <= VIEWER_RANGE);
  return { ...frame, zombies: frame.zombies.filter(inView), pickups: frame.pickups.filter(inView) };
}
