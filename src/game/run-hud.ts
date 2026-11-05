import { BUILDING_DEFS } from '../../shared/protocol.ts';
import type { GameEvent, GameOverStats, PlayerEntity, PlayerStatus, WorldMap } from '../../shared/protocol.ts';
import type { SceneView } from '../engine/scene.ts';
import type { WorldRenderer } from '../engine/world-renderer.ts';
import type { ClientWorld } from './client-world.ts';
import { buildHud } from './hud-state.ts';
import type { RunResult, UiState } from './hud-state.ts';
import { hordeBanner, isLandmark, RunNotices } from './run-notices.ts';
import { recordRun } from './storage.ts';
import { TownMapView } from './town-map.ts';

const HUD_INTERVAL_MS = 100;
const SIGNAL_WEAK_MS = 1500;

/** Everything a run has on screen, cleared at either end of it. */
export const NO_RUN_UI = {
  paused: false,
  mapOpen: false,
  hud: null,
  banner: null,
  place: null,
  levelCard: null,
  result: null,
  restarting: false,
} as const satisfies Partial<UiState>;

/** 0..1 for the low-health effects. Anyone not on their feet has no use for them. */
export function healthFraction(local: PlayerEntity | null): number {
  return local && local.status === 'alive' ? local.health / local.maxHealth : 1;
}

/** Colour drains as the local player does. */
export function deathFade(status: PlayerStatus | undefined, gameOver: boolean): number {
  const isDead = status === 'dead';
  if (gameOver) return 0.88;
  if (isDead) return 0.7;
  return status === 'downed' ? 0.4 : 0;
}

/**
 * Records the run and words the result, the moment it ends: a teammate can start
 * the next run before this player ever sees the results.
 * Someone who joined a finished room has no run of their own.
 */
export function finishRun(stats: GameOverStats, localId: string): RunResult {
  const local = stats.players.find((player) => player.id === localId);
  const score = local?.score ?? 0;
  const kills = local?.kills ?? 0;
  const isNewBest = local ? recordRun({ score, kills, wave: stats.wave, durationSec: stats.durationSec }, undefined, local.name) : false;
  return { stats, localId, score, kills, isNewBest };
}

export interface HudFrame {
  readonly world: ClientWorld;
  readonly scene: SceneView;
  readonly renderer: WorldRenderer;
  readonly ms: number;
  /** Co-op only, and the time of the last snapshot to measure the silence from. */
  readonly networked: boolean;
  readonly lastSnapshotMs: number;
}

/** Keeps the Vue-facing state and the town map in step with the run, a few times a second. */
export class RunHud {
  private readonly notices = new RunNotices();
  private readonly ui: () => UiState;
  private readonly publish: (patch: Partial<UiState>) => void;
  private town: TownMapView | null = null;
  private townCanvas: HTMLCanvasElement | null = null;
  private lastHudMs = 0;
  private lastScene: SceneView | null = null;

  constructor(ui: () => UiState, publish: (patch: Partial<UiState>) => void) {
    this.ui = ui;
    this.publish = publish;
  }

  setMap(map: WorldMap): void {
    this.town = new TownMapView(map);
  }

  /** A new run, on this map or the next. */
  reset(): void {
    this.notices.reset();
    this.town?.clearVisited();
  }

  /** The map screen hands over its canvas when it opens, and null when it closes. */
  attachTownCanvas(canvas: HTMLCanvasElement | null): void {
    this.townCanvas = canvas;
    const town = this.town;
    const canSize = canvas !== null && town !== null;
    if (canSize) {
      canvas.width = town.width;
      canvas.height = town.height;
    }
    this.paintTown();
  }

  private paintTown(): void {
    const ctx = this.townCanvas?.getContext('2d') ?? null;
    const scene = this.lastScene;
    const canPaint = ctx !== null && scene !== null;
    if (canPaint) this.town?.paint(ctx, scene.players, scene.localId, scene.exit);
  }

  onEvent(event: GameEvent, now: number): void {
    const banner = hordeBanner(event);
    if (banner) this.publish({ banner: this.notices.banner(banner, now) });
  }

  /** The level's title card. Nothing said in the last town is worth keeping up beside it. */
  showLevel(level: number, now: number): void {
    this.publish({ levelCard: this.notices.levelCard(level, now), banner: null, place: null });
  }

  /** Who walked in where, and what the floor would not give up. */
  private noticeSurroundings(renderer: WorldRenderer, world: ClientWorld, ms: number): void {
    const local = world.localPlayer;
    if (!local) return;
    const enteredId = this.notices.entered(local.indoors);
    const building = enteredId === null ? null : this.town?.building(enteredId) ?? null;
    if (building) {
      this.town?.markVisited(building.id);
      if (isLandmark(building.kind)) this.publish({ place: this.notices.place(BUILDING_DEFS[building.kind].label, ms) });
    }
    const refused = this.notices.refusal(local, world.latest?.pickups ?? [], ms);
    if (refused) renderer.note(refused, world.predictor.x, world.predictor.y);
  }

  tick(frame: HudFrame): void {
    const { world, scene, renderer, ms } = frame;
    this.lastScene = scene;
    const notDue = ms - this.lastHudMs < HUD_INTERVAL_MS;
    if (notDue) return;
    this.lastHudMs = ms;
    this.noticeSurroundings(renderer, world, ms);
    this.paintTown();
    const snapshot = world.latest;
    const local = world.localPlayer;
    const hasRun = snapshot !== null && local !== null;
    if (!hasRun) return;
    const viewer = scene.viewerId === local.id ? null : scene.players.find((player) => player.id === scene.viewerId);
    this.publish({
      hud: buildHud(snapshot, local, viewer?.name ?? null),
      signalWeak: frame.networked && ms - frame.lastSnapshotMs > SIGNAL_WEAK_MS,
      ...this.notices.expired(this.ui(), ms),
    });
  }
}
