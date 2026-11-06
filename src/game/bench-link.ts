import type { SnapshotPacket } from '../../shared/protocol.ts';
import type { BenchAction } from '../../shared/workbench.ts';
import type { GameTransport } from '../network/transport.ts';
import { tapBenchAction } from './analytics/event-tap.ts';

interface BenchHost {
  transport(): GameTransport | null;
  menuUp(): boolean;
  setInputEnabled(enabled: boolean): void;
  /** Lets go of whatever was held when the bench came up. */
  settle(): void;
}

/** The client's end of the workbench: takes the controls while it is up, and sends what the screen asks. */
export class BenchLink {
  /** True while the run is held at the bench. */
  open = false;

  private readonly host: BenchHost;

  constructor(host: BenchHost) {
    this.host = host;
  }

  observe(snapshot: SnapshotPacket): void {
    const open = snapshot.bench !== undefined;
    const unchanged = open === this.open;
    if (unchanged) return;
    this.open = open;
    this.host.setInputEnabled(!open && !this.host.menuUp());
    if (open) this.host.settle();
  }

  send(action: BenchAction): void {
    tapBenchAction(action);
    this.host.transport()?.sendBench(action);
  }
}
