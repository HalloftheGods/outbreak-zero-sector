/** A browser that wakes this late has been throttled: drop the lost time, do not replay it. */
const MAX_CATCH_UP_TICKS = 5;

/**
 * Fixed-rate timer that schedules each tick against an absolute deadline, so
 * setTimeout's lateness never accumulates. Stopping it suspends the clock:
 * time spent stopped is not owed when it starts again.
 */
export class TickClock {
  private readonly tickMs: number;
  private readonly onTick: () => void;
  private readonly now: () => number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextAt = 0;

  constructor(tickMs: number, onTick: () => void, now: () => number = () => performance.now()) {
    this.tickMs = tickMs;
    this.onTick = onTick;
    this.now = now;
  }

  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer !== null) return;
    this.nextAt = this.now() + this.tickMs;
    this.schedule();
  }

  stop(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const wait = Math.max(0, this.nextAt - this.now());
    this.timer = setTimeout(this.fire, wait);
  }

  private readonly fire = (): void => {
    const now = this.now();
    let ticks = 0;
    while (now >= this.nextAt && ticks < MAX_CATCH_UP_TICKS) {
      this.nextAt += this.tickMs;
      ticks += 1;
      this.onTick();
      // onTick may have stopped the clock.
      if (this.timer === null) return;
    }
    if (now >= this.nextAt) this.nextAt = now + this.tickMs;
    this.schedule();
  };
}
