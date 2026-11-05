import { freeCharacter } from './characters.ts';
import { updateBullets } from './combat.ts';
import { openedContainers } from './container-search.ts';
import { LEAD_IN_SEC, PLAYER_RADIUS, SNAPSHOT_RANGE, SPAWN_SCATTER, TICK_DT } from './constants.ts';
import { BASELINE_DIFFICULTY } from './difficulty.ts';
import type { DifficultyId } from './difficulty.ts';
import { FlowField } from './flow-field.ts';
import { gearField } from './gun-upgrades.ts';
import { enterTown, moveToNextTown, placeAtEntry } from './level-change.ts';
import { exitBoarded, exitEntity } from './level-exit.ts';
import { FINAL_LEVEL, FIRST_LEVEL, levelPopulation, levelSeed } from './levels.ts';
import { placeTownLoot } from './loot.ts';
import { giveReturnKit, giveStartingLoadout, updateDownedPlayers } from './player-health.ts';
import { createPlayer, reclaimDeparted, reclaimLive, rememberDeparted } from './player-roster.ts';
import type { Arrival } from './player-roster.ts';
import { updatePickups } from './pickups.ts';
import { receiveInput, updatePlayer } from './players.ts';
import { WEAPON_ORDER } from './protocol.ts';
import type {
  ClientInputPacket,
  ExitEntity,
  GameEvent,
  GameOverStats,
  GamePhase,
  PlayerEntity,
  RunOutcome,
  SnapshotPacket,
  WeaponId,
  WorldMap,
} from './protocol.ts';
import { createRng } from './rng.ts';
import type { PlayerState, SimState } from './sim-state.ts';
import { emit, openGroundNear, standingPlayers } from './sim-state.ts';
import { SpatialHashGrid } from './spatial-grid.ts';
import { seedPopulation, updatePopulation } from './town-population.ts';
import { hordeHostiles, hordesSurvivedHere, updateWaves } from './waves.ts';
import { benchCommand, benchField, openBench, updateBench } from './workbench.ts';
import type { BenchAction, WorkbenchMode } from './workbench.ts';
import { generateWorldMap } from './world-map.ts';
import { rebuildZombieGrid, removeDeadZombies, updateZombies } from './zombies.ts';

export interface SimulationOptions {
  readonly seed: number;
  readonly random?: () => number;
  /** Lights Out, the balance the game was tuned on, unless a run asks for another. */
  readonly difficulty?: DifficultyId;
  /** Solo holds at the bench, a server times it too, and leaving it out drives straight on. */
  readonly workbench?: WorkbenchMode;
  /** Begin in this town instead of the first. Anyone joining then arrives with the return kit. */
  readonly startLevel?: number;
}

/** A level number held to the real range, so a stale or hand-edited save cannot start a town that is not there. */
function clampLevel(level: number | undefined): number {
  const whole = Number.isFinite(level) ? Math.floor(level!) : FIRST_LEVEL;
  return Math.min(FINAL_LEVEL, Math.max(FIRST_LEVEL, whole));
}

const ROUNDED_EVENT_FIELDS = ['x', 'y', 'angle', 'radius'] as const;

/** The + 0 folds -0 into 0, which JSON would otherwise change under a reader's feet. */
const round2 = (value: number): number => Math.round(value * 100) / 100 + 0;

function roundEvent(event: GameEvent): GameEvent {
  const copy: Record<string, unknown> = { ...event };
  for (const field of ROUNDED_EVENT_FIELDS) {
    const value = copy[field];
    const eventHasField = typeof value === 'number';
    if (eventHasField) copy[field] = round2(value);
  }
  return copy as unknown as GameEvent;
}

const exitView = (exit: ExitEntity | null): ExitEntity | null => exit && { ...exit, progress: round2(exit.progress) };

function magazines(p: PlayerState): Record<WeaponId, number> {
  const entries = WEAPON_ORDER.map((weapon) => [weapon, p.guns[weapon]?.ammo ?? 0]);
  return Object.fromEntries(entries) as Record<WeaponId, number>;
}

function playerSnapshot(p: PlayerState): PlayerEntity {
  return {
    id: p.id,
    name: p.name,
    skin: p.skin,
    x: round2(p.x),
    y: round2(p.y),
    angle: round2(p.angle),
    moving: p.moving,
    status: p.status,
    health: round2(p.health),
    maxHealth: p.maxHealth,
    weapon: p.weapon,
    ammo: p.ammo,
    magSize: p.magSize,
    reserve: p.reserve,
    owned: [...p.owned],
    ammoBag: { ...p.ammoBag },
    mags: magazines(p),
    medkits: p.medkits,
    knife: p.knife,
    search: round2(p.search),
    indoors: p.indoors,
    reload: round2(p.reload),
    bleedout: round2(p.bleedout),
    revive: round2(p.revive),
    score: p.score,
    kills: p.kills,
    lastInputSeq: p.lastInputSeq,
    ...gearField(p),
  };
}

/**
 * The authoritative game. The Node server and solo mode both drive this; time
 * comes only from step() and randomness only from the seeded RNG, so a run is
 * reproducible from its seed and its inputs.
 */
export class GameSimulation {
  private readonly sim: SimState;

  constructor(options: SimulationOptions) {
    const startLevel = clampLevel(options.startLevel);
    const map = generateWorldMap(levelSeed(options.seed, startLevel));
    this.sim = {
      runSeed: options.seed,
      difficulty: options.difficulty ?? BASELINE_DIFFICULTY,
      map,
      rng: options.random ?? createRng(options.seed ^ 0x5eed),
      flow: new FlowField(map),
      noiseFlow: new FlowField(map),
      grid: new SpatialHashGrid(),
      tick: 0,
      runStartTick: 0,
      phase: 'intermission',
      level: startLevel,
      exit: null,
      hordesBehind: 0,
      wave: 0,
      intermissionLeft: LEAD_IN_SEC,
      hordeLeft: 0,
      spawnQueue: [],
      spawnTimer: 0,
      populationTarget: levelPopulation(startLevel),
      topUpTimer: 0,
      noises: [],
      players: [],
      departed: new Map(),
      zombies: [],
      bullets: [],
      pickups: [],
      containers: [],
      events: [],
      gameOver: null,
      nextEntity: 0,
      workbench: options.workbench ?? 'off',
      bench: null,
    };
    placeTownLoot(this.sim);
    seedPopulation(this.sim);
    this.announceRunStart();
  }

  /** The town being played, which changes with the level. */
  get map(): WorldMap {
    return this.sim.map;
  }

  get playerCount(): number {
    return this.sim.players.length;
  }

  get phase(): GamePhase {
    return this.sim.phase;
  }

  get level(): number {
    return this.sim.level;
  }

  get difficulty(): DifficultyId {
    return this.sim.difficulty;
  }

  /** Only an empty room can change it, and it takes a fresh start so the town is stocked and peopled for it. */
  setDifficulty(difficulty: DifficultyId): void {
    const sim = this.sim;
    const roomInUse = sim.players.length > 0;
    const unchanged = sim.difficulty === difficulty;
    if (roomInUse || unchanged) return;
    sim.difficulty = difficulty;
    this.restart();
  }

  private announceRunStart(): void {
    emit(this.sim, { type: 'level_start', level: this.sim.level });
    emit(this.sim, { type: 'wave_intermission', wave: 1, seconds: LEAD_IN_SEC });
  }

  /** Near a living teammate if there is one, otherwise at the map spawn. */
  private entryPoint(): { x: number; y: number } {
    const sim = this.sim;
    const friend = sim.players.find((p) => p.status === 'alive');
    const home = friend ?? this.map.spawn;
    return openGroundNear(sim, home.x, home.y, 8, SPAWN_SCATTER, PLAYER_RADIUS + 1);
  }

  /** A newcomer, armed for how far the run has got. People gathering in the lead-in all start equal. */
  private newcomer(arrival: Arrival): PlayerState {
    const player = createPlayer(arrival, this.entryPoint());
    const runUnderway = this.sim.wave > 0 || this.sim.level > FIRST_LEVEL;
    if (runUnderway) giveReturnKit(player);
    return player;
  }

  /** A token that left this run earlier picks up where it stopped; anyone else is a newcomer. */
  addPlayer(id: string, name: string, token: string | null = null, character?: number): PlayerEntity {
    const existing = this.sim.players.find((p) => p.id === id);
    if (existing) return playerSnapshot(existing);

    const taken = new Set(this.sim.players.map((p) => p.skin));
    const arrival: Arrival = { id, name, token, skin: freeCharacter(taken, character) };
    const live = reclaimLive(this.sim, arrival);
    if (live) return playerSnapshot(live);
    const player = reclaimDeparted(this.sim, arrival) ?? this.newcomer(arrival);
    this.sim.players.push(player);
    return playerSnapshot(player);
  }

  /** The id now playing under a token, if any. */
  playerWithToken(token: string): string | null {
    return this.sim.players.find((p) => p.token === token)?.id ?? null;
  }

  removePlayer(id: string): void {
    const sim = this.sim;
    const leaving = sim.players.find((p) => p.id === id);
    if (leaving) rememberDeparted(sim, leaving);
    sim.players = sim.players.filter((p) => p.id !== id);

    const wasRunning = sim.phase !== 'gameover';
    this.checkGameOver();
    // step() is frozen from here, so this frame takes a tick of its own or clients would read it as the last one.
    const endedJustNow = wasRunning && sim.phase === 'gameover';
    if (endedJustNow) sim.tick += 1;
  }

  setInput(id: string, input: ClientInputPacket): void {
    const player = this.sim.players.find((p) => p.id === id);
    if (player) receiveInput(player, input);
  }

  benchCommand(id: string, action: BenchAction): void {
    const player = this.sim.players.find((p) => p.id === id);
    if (player) benchCommand(this.sim, player, action);
  }

  /** Advances one tick of TICK_DT. Does nothing with an empty room or after game over. */
  step(): void {
    const sim = this.sim;
    const frozen = sim.phase === 'gameover' || sim.players.length === 0;
    if (frozen) return;

    sim.tick += 1;
    if (sim.bench) {
      const vanLeaves = updateBench(sim);
      if (vanLeaves) moveToNextTown(sim);
      return;
    }
    rebuildZombieGrid(sim);
    for (const p of sim.players) updatePlayer(sim, p);
    updateBullets(sim);
    updateZombies(sim);
    removeDeadZombies(sim);
    updatePickups(sim);
    updateDownedPlayers(sim);
    // Before the waves: a horde starting on this tick must not hand the fallen their return.
    this.checkGameOver();
    if (sim.phase === 'gameover') return;
    const leaving = exitBoarded(sim);
    if (leaving) {
      this.leaveTown();
      return;
    }
    updateWaves(sim);
    updatePopulation(sim);
  }

  private leaveTown(): void {
    const sim = this.sim;
    const lastTown = sim.level >= FINAL_LEVEL;
    if (lastTown) this.endRun('victory');
    else if (!openBench(sim)) moveToNextTown(sim);
  }

  private checkGameOver(): void {
    const sim = this.sim;
    const runActive = sim.phase !== 'gameover' && sim.players.length > 0;
    const everyoneGone = runActive && standingPlayers(sim).length === 0;
    if (everyoneGone) this.endRun('defeat');
  }

  private endRun(outcome: RunOutcome): void {
    const sim = this.sim;
    const players = [...sim.players]
      .sort((a, b) => b.score - a.score)
      .map(({ id, name, skin, kills, score }) => ({ id, name, skin, kills, score }));
    const stats: GameOverStats = {
      outcome,
      difficulty: sim.difficulty,
      level: sim.level,
      wave: sim.hordesBehind + hordesSurvivedHere(sim),
      durationSec: round2((sim.tick - sim.runStartTick) * TICK_DT),
      players,
    };
    sim.phase = 'gameover';
    sim.gameOver = stats;
    emit(sim, { type: 'game_over', stats });
  }

  /**
   * Starts a new run with everyone still connected, from level 1 unless told otherwise.
   * Ticks keep counting up. Starting past level 1 hands out the return kit, as for anyone arriving mid-run.
   */
  restart(fromLevel?: number): void {
    const sim = this.sim;
    const level = clampLevel(fromLevel);
    sim.runStartTick = sim.tick;
    sim.hordesBehind = 0;
    sim.gameOver = null;
    sim.departed.clear();
    enterTown(sim, level);

    for (const p of sim.players) {
      placeAtEntry(sim, p);
      p.status = 'alive';
      p.health = p.maxHealth;
      p.score = 0;
      p.kills = 0;
      p.dryFireCooldown = 0;
      if (level > FIRST_LEVEL) giveReturnKit(p);
      else giveStartingLoadout(p);
    }
    this.announceRunStart();
  }

  /** A detached, JSON-safe view of the world. Drains the event queue. */
  snapshot(): SnapshotPacket {
    const sim = this.sim;
    const events = sim.events.map(roundEvent);
    sim.events = [];
    const inRange = (item: { x: number; y: number }): boolean =>
      sim.players.some((p) => Math.hypot(p.x - item.x, p.y - item.y) <= SNAPSHOT_RANGE);
    return {
      type: 'snapshot',
      tick: sim.tick,
      phase: sim.phase,
      level: sim.level,
      mapSeed: sim.map.seed,
      wave: sim.wave,
      intermission: sim.phase === 'intermission' ? round2(Math.max(0, sim.intermissionLeft)) : 0,
      hostiles: hordeHostiles(sim),
      players: sim.players.map(playerSnapshot),
      zombies: sim.zombies.filter(inRange).map((z) => ({
        id: z.id,
        type: z.type,
        x: round2(z.x),
        y: round2(z.y),
        angle: round2(z.angle),
        health: round2(z.health),
        maxHealth: z.maxHealth,
        attacking: z.attacking,
      })),
      bullets: sim.bullets.map((b) => ({
        id: b.id,
        shooterId: b.shooterId,
        x: round2(b.x),
        y: round2(b.y),
        vx: round2(b.vx),
        vy: round2(b.vy),
      })),
      pickups: sim.pickups.filter(inRange).map((item) => ({ id: item.id, type: item.type, x: round2(item.x), y: round2(item.y) })),
      exit: exitView(exitEntity(sim)),
      openedContainers: openedContainers(sim),
      events,
      gameOver: sim.gameOver ? { ...sim.gameOver, players: sim.gameOver.players.map((p) => ({ ...p })) } : null,
      ...benchField(sim),
    };
  }
}
