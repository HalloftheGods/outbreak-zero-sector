import { isBunkerSeed } from '../../shared/home-protocol.ts';
import { levelDef } from '../../shared/levels.ts';
import type { SnapshotPacket, WorldMap } from '../../shared/protocol.ts';
import { generateWorldMap } from '../../shared/world-map.ts';
import type { WorldRenderer } from '../engine/world-renderer.ts';
import type { ClientWorld } from './client-world.ts';
import type { RunHud } from './run-hud.ts';
import { noteStageCut } from './stage-cut.ts';

/** The town and level this client has built, kept in step with what the sim says it is playing. */
export class RunStage {
  private readonly hud: RunHud;
  private readonly renderer: () => WorldRenderer | null;
  private mapSeed: number | null = null;
  private level: number | null = null;

  constructor(hud: RunHud, renderer: () => WorldRenderer | null) {
    this.hud = hud;
    this.renderer = renderer;
  }

  /** Builds a town for all that draws it. Its level comes with the next snapshot. */
  open(mapSeed: number): WorldMap {
    const map = generateWorldMap(mapSeed);
    this.mapSeed = mapSeed;
    this.level = null;
    this.hud.setMap(map);
    this.renderer()?.setMap(map);
    noteStageCut(isBunkerSeed(mapSeed));
    return map;
  }

  /** A new run can start in the very town the last one ended in, and it still gets its title card. */
  rewind(): void {
    this.level = null;
  }

  /** Runs ahead of the snapshot's events, which already belong to the town it describes. */
  follow(world: ClientWorld, snapshot: SnapshotPacket, nowMs: number): void {
    const newTown = snapshot.mapSeed !== this.mapSeed;
    if (newTown) world.enterTown(this.open(snapshot.mapSeed));
    const sameLevel = snapshot.level === this.level;
    if (sameLevel) return;
    this.level = snapshot.level;
    const home = isBunkerSeed(snapshot.mapSeed);
    if (home) {
      this.renderer()?.setTheme('bunker');
      this.hud.clearNotices();
      return;
    }
    this.renderer()?.setTheme(levelDef(snapshot.level).theme);
    this.hud.showLevel(snapshot.level, nowMs);
  }
}
