import { TICK_DT, TICK_RATE } from '../../shared/constants.ts';
import type { ClientInputPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import { GameSimulation } from '../../shared/simulation.ts';
import { TickClock } from './tick-clock.ts';
import type { GameTransport } from './transport.ts';

const LOCAL_PLAYER_ID = 'local';

/** Solo play: the same simulation the server runs, stepped in the browser. */
export class LocalSession implements GameTransport {
  readonly kind = 'solo';
  /** Snapshots here arrive without jitter, so two ticks of buffer is enough. */
  readonly interpolationDelayMs = 2 * TICK_DT * 1000;

  onWelcome: (packet: WelcomePacket) => void = () => {};
  onSnapshot: (packet: SnapshotPacket) => void = () => {};
  onClosed: (reason: string) => void = () => {};

  /** Exposed for the dev handle. */
  sim: GameSimulation | null = null;

  private name = '';
  private paused = false;
  private readonly clock = new TickClock(1000 / TICK_RATE, () => this.tick());

  connect(name: string): void {
    this.name = name;
    this.beginRun();
  }

  sendInput(input: ClientInputPacket): void {
    this.sim?.setInput(LOCAL_PLAYER_ID, input);
  }

  /** Every run in solo gets a fresh city. */
  requestRestart(): void {
    this.clock.stop();
    this.beginRun();
  }

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) this.clock.stop();
    else this.clock.start();
  }

  disconnect(): void {
    this.clock.stop();
    this.sim = null;
  }

  private beginRun(): void {
    const seed = Math.floor(Math.random() * 0x7fffffff);
    const sim = new GameSimulation({ seed });
    sim.addPlayer(LOCAL_PLAYER_ID, this.name);
    this.sim = sim;
    this.paused = false;
    this.onWelcome({ type: 'welcome', yourId: LOCAL_PLAYER_ID, tickRate: TICK_RATE, mapSeed: seed });
    this.onSnapshot(sim.snapshot());
    this.clock.start();
  }

  private tick(): void {
    const sim = this.sim;
    if (!sim) return;
    sim.step();
    this.onSnapshot(sim.snapshot());
  }
}
