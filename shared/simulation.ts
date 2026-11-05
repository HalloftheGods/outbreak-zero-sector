import { updateBullets } from './combat.ts';
import { LEAD_IN_SEC, PLAYER_RADIUS, SNAPSHOT_RANGE, STANDING_POPULATION, TICK_DT } from './constants.ts';
import { FlowField } from './flow-field.ts';
import { placeTownLoot } from './loot.ts';
import { giveReturnKit, giveStartingLoadout, updateDownedPlayers } from './player-health.ts';
import { createPlayer, reclaimDeparted, reclaimLive, rememberDeparted } from './player-roster.ts';
import type { Arrival } from './player-roster.ts';
import { updatePickups } from './pickups.ts';
import { receiveInput, updatePlayer } from './players.ts';
import { SURVIVOR_SKIN_COUNT, WEAPON_ORDER } from './protocol.ts';
import type {
  ClientInputPacket,
  GameEvent,
  GameOverStats,
  GamePhase,
  PlayerEntity,
  SnapshotPacket,
  WeaponId,
  WorldMap,
} from './protocol.ts';
import { createRng } from './rng.ts';
import type { PlayerState, SimState } from './sim-state.ts';
import { emit, openGroundNear, standingPlayers } from './sim-state.ts';
import { SpatialHashGrid } from './spatial-grid.ts';
import { seedPopulation, updatePopulation } from './town-population.ts';
import { hordeHostiles, updateWaves } from './waves.ts';
import { generateWorldMap } from './world-map.ts';
import { rebuildZombieGrid, removeDeadZombies, updateZombies } from './zombies.ts';

export interface SimulationOptions {
  readonly seed: number;
  readonly random?: () => number;
}

const SPAWN_SCATTER = 28;
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
    indoors: p.indoors,
    reload: round2(p.reload),
    bleedout: round2(p.bleedout),
    revive: round2(p.revive),
    score: p.score,
    kills: p.kills,
    lastInputSeq: p.lastInputSeq,
  };
}

/**
 * The authoritative game. The Node server and solo mode both drive this; time
 * comes only from step() and randomness only from the seeded RNG, so a run is
 * reproducible from its seed and its inputs.
 */
export class GameSimulation {
  readonly map: WorldMap;
  private readonly sim: SimState;

  constructor(options: SimulationOptions) {
    this.map = generateWorldMap(options.seed);
    this.sim = {
      map: this.map,
      rng: options.random ?? createRng(options.seed ^ 0x5eed),
      flow: new FlowField(this.map),
      noiseFlow: new FlowField(this.map),
      grid: new SpatialHashGrid(),
      tick: 0,
      runStartTick: 0,
      phase: 'intermission',
      wave: 0,
      intermissionLeft: LEAD_IN_SEC,
      hordeLeft: 0,
      spawnQueue: [],
      spawnTimer: 0,
      populationTarget: STANDING_POPULATION,
      topUpTimer: 0,
      noises: [],
      players: [],
      departed: new Map(),
      zombies: [],
      bullets: [],
      pickups: [],
      events: [],
      gameOver: null,
      nextEntity: 0,
    };
    placeTownLoot(this.sim);
    seedPopulation(this.sim);
    emit(this.sim, { type: 'wave_intermission', wave: 1, seconds: LEAD_IN_SEC });
  }

  get playerCount(): number {
    return this.sim.players.length;
  }

  get phase(): GamePhase {
    return this.sim.phase;
  }

  private unusedSkin(): number {
    const taken = new Set(this.sim.players.map((p) => p.skin));
    for (let skin = 0; skin < SURVIVOR_SKIN_COUNT; skin++) {
      if (!taken.has(skin)) return skin;
    }
    return this.sim.players.length % SURVIVOR_SKIN_COUNT;
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
    const runUnderway = this.sim.wave > 0;
    if (runUnderway) giveReturnKit(player);
    return player;
  }

  /** A token that left this run earlier picks up where it stopped; anyone else is a newcomer. */
  addPlayer(id: string, name: string, token: string | null = null): PlayerEntity {
    const existing = this.sim.players.find((p) => p.id === id);
    if (existing) return playerSnapshot(existing);

    const arrival: Arrival = { id, name, token, skin: this.unusedSkin() };
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

  /** Advances one tick of TICK_DT. Does nothing with an empty room or after game over. */
  step(): void {
    const sim = this.sim;
    const frozen = sim.phase === 'gameover' || sim.players.length === 0;
    if (frozen) return;

    sim.tick += 1;
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
    updateWaves(sim);
    updatePopulation(sim);
  }

  private checkGameOver(): void {
    const sim = this.sim;
    const runActive = sim.phase !== 'gameover' && sim.players.length > 0;
    const everyoneGone = runActive && standingPlayers(sim).length === 0;
    if (!everyoneGone) return;

    const players = [...sim.players]
      .sort((a, b) => b.score - a.score)
      .map(({ id, name, skin, kills, score }) => ({ id, name, skin, kills, score }));
    const hordeUnfinished = sim.phase === 'wave';
    const stats: GameOverStats = {
      wave: hordeUnfinished ? sim.wave - 1 : sim.wave,
      durationSec: round2((sim.tick - sim.runStartTick) * TICK_DT),
      players,
    };
    sim.phase = 'gameover';
    sim.gameOver = stats;
    emit(sim, { type: 'game_over', stats });
  }

  /** Starts a new run on the same map with everyone still connected. Ticks keep counting up. */
  restart(): void {
    const sim = this.sim;
    sim.runStartTick = sim.tick;
    sim.phase = 'intermission';
    sim.wave = 0;
    sim.intermissionLeft = LEAD_IN_SEC;
    sim.hordeLeft = 0;
    sim.spawnQueue = [];
    sim.spawnTimer = 0;
    sim.topUpTimer = 0;
    sim.noises = [];
    sim.zombies = [];
    sim.bullets = [];
    sim.pickups = [];
    sim.events = [];
    sim.gameOver = null;
    sim.departed.clear();
    sim.flow.invalidate();
    sim.noiseFlow.invalidate();
    placeTownLoot(sim);
    seedPopulation(sim);

    for (const p of sim.players) {
      const spot = openGroundNear(sim, this.map.spawn.x, this.map.spawn.y, 8, SPAWN_SCATTER, PLAYER_RADIUS + 1);
      p.x = spot.x;
      p.y = spot.y;
      p.status = 'alive';
      p.moving = false;
      p.health = p.maxHealth;
      p.bleedout = 0;
      p.revive = 0;
      p.score = 0;
      p.kills = 0;
      p.indoors = null;
      p.reloadQueued = false;
      p.weaponQueued = null;
      p.meleeQueued = false;
      p.healQueued = false;
      p.shootQueued = false;
      p.dryFireCooldown = 0;
      giveStartingLoadout(p);
    }
    emit(sim, { type: 'wave_intermission', wave: 1, seconds: LEAD_IN_SEC });
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
      events,
      gameOver: sim.gameOver ? { ...sim.gameOver, players: sim.gameOver.players.map((p) => ({ ...p })) } : null,
    };
  }
}
