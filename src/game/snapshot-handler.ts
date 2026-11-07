import { isBunkerSeed } from '../../shared/home-protocol.ts';
import type { GameEvent, GameOverStats, PlayerEntity, SnapshotPacket } from '../../shared/protocol.ts';
import type { ClientWorld } from './client-world.ts';
import { recordGameFinished, recordLevelReached } from './level-progress.ts';
import { KillJuice } from './kill-juice.ts';
import { HORDE_WIPED_BANNER, pickupNote } from './run-notices.ts';
import { finishRun, healthFraction } from './run-hud.ts';
import type { RunHost } from './run-session.ts';
import { loadLeaderboard } from './storage.ts';
import { loadBests } from './trip-record.ts';

const EVENT_MUSIC: Partial<Record<GameEvent['type'], 'wave' | 'intermission'>> = {
  wave_start: 'wave',
  wave_intermission: 'intermission',
};

/** Takes each snapshot into the run: events to the senses, the world's latest, the end of the run. */
export class SnapshotHandler {
  /** The bunker's music is the horde's while the blast door is breached. */
  private breached = false;
  private readonly juice = new KillJuice();

  constructor(
    private readonly host: RunHost,
    private readonly beginRun: () => void,
  ) {}

  onSnapshot(snapshot: SnapshotPacket): void {
    const { state, stage, bench, home, audio, renderer } = this.host;
    const world = state.world;
    if (!world) return;
    const now = performance.now();
    // Off the stats, not the last frame: a run that ends between ticks may never have a frame of its own.
    const runRestarted = state.runResult !== null && snapshot.gameOver === null;
    if (runRestarted) {
      world.restart();
      renderer?.reset();
      stage.rewind();
      this.juice.reset();
      this.beginRun();
    }
    stage.follow(world, snapshot, now);
    bench.observe(snapshot);
    audio.setLevel(snapshot.level);
    const before = world.localPlayer;
    const after = snapshot.players.find((player) => player.id === world.localId) ?? null;
    const onATrip = after?.home !== undefined;
    // Reaching a town on a trip opens nothing: only the van home does, and that comes on a receipt.
    const inArcade = snapshot.home === undefined;
    // A Daily Night starts deep in the game: it unlocks nothing on the Levels page.
    const newLevel = inArcade && state.daily === null && snapshot.level > state.levelNoted;
    if (newLevel) {
      state.levelNoted = snapshot.level;
      recordLevelReached(snapshot.level);
    }
    this.setMood(snapshot, world.latest === null);
    state.lastSnapshotMs = now;
    for (const event of snapshot.events) this.onGameEvent(event, world, now, before, after);
    this.punctuate(snapshot, world.localId, after, now);
    world.push(snapshot, now);
    if (onATrip) home.observe(snapshot, world.localId, now);
    const justEnded = snapshot.gameOver !== null && state.runResult === null;
    if (justEnded) this.enterGameOver(snapshot.gameOver!, world.localId, now);
  }

  /** The kills in this snapshot that deserve a beat: a held frame, a flash, a word over the action. */
  private punctuate(snapshot: SnapshotPacket, localId: string | null, after: PlayerEntity | null, now: number): void {
    const beat = this.juice.read(snapshot.events, localId, healthFraction(after), now);
    if (!beat) return;
    const { renderer, runHud } = this.host;
    if (beat.freezeMs > 0) this.host.hitStop(beat.freezeMs);
    if (beat.flash > 0) renderer?.effects.addFlash(beat.flash);
    if (beat.callout) runHud.callout(beat.callout, now);
    if (beat.hordeWiped) runHud.say(HORDE_WIPED_BANNER, now);
  }

  /** Someone joining mid-horde gets no wave_start, so the first frame sets the mood. The bunker has its own. */
  private setMood(snapshot: SnapshotPacket, firstOfRun: boolean): void {
    const { state, audio } = this.host;
    const bunker = isBunkerSeed(snapshot.mapSeed);
    const moved = state.inBunker !== bunker;
    state.inBunker = bunker;
    const breached = bunker && snapshot.home?.overrun?.phase === 'breached';
    const turned = breached !== this.breached;
    this.breached = breached;
    const sceneChanged = moved || turned;
    if (bunker) {
      if (sceneChanged) audio.setScene(breached ? 'wave' : 'bunker');
      return;
    }
    const settling = firstOfRun || moved;
    if (settling) audio.setScene(snapshot.phase === 'wave' ? 'wave' : 'intermission');
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
    state.runResult = finishRun(stats, localId, state.daily);
    const won = stats.outcome === 'victory';
    if (won && state.daily === null) recordGameFinished();
    state.gameOverAtMs = now;
    input.setEnabled(false);
    audio.setScene(won ? 'victory' : 'gameover');
    this.host.publish({ paused: false, mapOpen: false, banner: null, place: null, ...loadBests(), leaderboard: loadLeaderboard() });
  }
}
