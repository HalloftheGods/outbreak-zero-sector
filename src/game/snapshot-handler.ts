import type { GameEvent, GameOverStats, PlayerEntity, SnapshotPacket } from '../../shared/protocol.ts';
import type { ClientWorld } from './client-world.ts';
import { recordGameFinished, recordLevelReached } from './level-progress.ts';
import { finishRun } from './run-hud.ts';
import { pickupNote } from './run-notices.ts';
import type { RunHost } from './run-session.ts';
import { loadBest, loadLeaderboard } from './storage.ts';

const EVENT_MUSIC: Partial<Record<GameEvent['type'], 'wave' | 'intermission'>> = {
  wave_start: 'wave',
  wave_intermission: 'intermission',
};

/** Takes each snapshot into the run: events to the senses, the world's latest, the end of the run. */
export class SnapshotHandler {
  constructor(
    private readonly host: RunHost,
    private readonly beginRun: () => void,
  ) {}

  onSnapshot(snapshot: SnapshotPacket): void {
    const { state, stage, bench, audio, renderer } = this.host;
    const world = state.world;
    if (!world) return;
    const now = performance.now();
    // Off the stats, not the last frame: a run that ends between ticks may never have a frame of its own.
    const runRestarted = state.runResult !== null && snapshot.gameOver === null;
    if (runRestarted) {
      world.restart();
      renderer?.reset();
      stage.rewind();
      this.beginRun();
    }
    stage.follow(world, snapshot, now);
    bench.observe(snapshot);
    // Someone joining mid-horde gets no wave_start, so the first frame sets the mood.
    audio.setLevel(snapshot.level);
    const newLevel = snapshot.level > state.levelNoted;
    if (newLevel) {
      state.levelNoted = snapshot.level;
      recordLevelReached(snapshot.level);
    }
    const firstOfRun = world.latest === null;
    if (firstOfRun) audio.setScene(snapshot.phase === 'wave' ? 'wave' : 'intermission');
    state.lastSnapshotMs = now;
    const before = world.localPlayer;
    const after = snapshot.players.find((player) => player.id === world.localId) ?? null;
    for (const event of snapshot.events) this.onGameEvent(event, world, now, before, after);
    world.push(snapshot, now);
    const justEnded = snapshot.gameOver !== null && state.runResult === null;
    if (justEnded) this.enterGameOver(snapshot.gameOver!, world.localId, now);
  }

  onGameEvent(event: GameEvent, world: ClientWorld, now: number, before: PlayerEntity | null, after: PlayerEntity | null): void {
    const { audio, renderer, runHud } = this.host;
    audio.handleEvent(event, world.localId);
    renderer?.handleEvent(event, {
      localId: world.localId,
      localX: world.predictor.x,
      localY: world.predictor.y,
      pickupNote: event.type === 'pickup' ? pickupNote(event.pickup, before, after) : undefined,
    });
    const music = EVENT_MUSIC[event.type];
    if (music) audio.setScene(music);
    runHud.onEvent(event, now);
  }

  enterGameOver(stats: GameOverStats, localId: string, now: number): void {
    const { state, input, audio } = this.host;
    state.runResult = finishRun(stats, localId);
    const won = stats.outcome === 'victory';
    if (won) recordGameFinished();
    state.gameOverAtMs = now;
    input.setEnabled(false);
    audio.setScene(won ? 'victory' : 'gameover');
    this.host.publish({ paused: false, mapOpen: false, banner: null, place: null, best: loadBest(), leaderboard: loadLeaderboard() });
  }
}
