import type { ServerPacket, SnapshotPacket } from '../../shared/protocol.ts';
import type { HostClock, PeerSocket } from '../../shared/room/peer.ts';

/** A link the test holds both ends of: what the host sent, how it closed, and whether it is backed up. */
export class FakePeer implements PeerSocket {
  open = true;
  /** While true, canTakeFrame says no, like a socket with its buffer full. */
  backedUp = false;
  readonly received: ServerPacket[] = [];
  closeCode: number | null = null;
  dropped = false;
  probes = 0;

  send(text: string): void {
    this.received.push(JSON.parse(text) as ServerPacket);
  }

  close(code: number): void {
    this.open = false;
    this.closeCode ??= code;
  }

  drop(): void {
    this.open = false;
    this.dropped = true;
  }

  canTakeFrame(): boolean {
    return !this.backedUp;
  }

  probe(): void {
    this.probes += 1;
  }

  get snapshots(): SnapshotPacket[] {
    return this.received.filter((packet): packet is SnapshotPacket => packet.type === 'snapshot');
  }

  get lastSnapshot(): SnapshotPacket | undefined {
    return this.snapshots.at(-1);
  }

  packet<T extends ServerPacket['type']>(type: T): Extract<ServerPacket, { type: T }> | undefined {
    return this.received.find((packet): packet is Extract<ServerPacket, { type: T }> => packet.type === type);
  }
}

interface Pending {
  readonly at: number;
  readonly fn: () => void;
}

/** Time that moves only when the test says so; due timers run in order, ties by when they were set. */
export class ManualClock implements HostClock {
  private time = 0;
  private nextHandle = 1;
  private readonly timers = new Map<number, Pending>();

  now(): number {
    return this.time;
  }

  after(ms: number, fn: () => void): number {
    const handle = this.nextHandle++;
    this.timers.set(handle, { at: this.time + ms, fn });
    return handle;
  }

  cancel(handle: unknown): void {
    this.timers.delete(handle as number);
  }

  get pending(): number {
    return this.timers.size;
  }

  advance(ms: number): void {
    const end = this.time + ms;
    for (let due = this.nextDue(end); due; due = this.nextDue(end)) {
      this.timers.delete(due[0]);
      this.time = Math.max(this.time, due[1].at);
      due[1].fn();
    }
    this.time = end;
  }

  private nextDue(end: number): [number, Pending] | undefined {
    let earliest: [number, Pending] | undefined;
    for (const entry of this.timers) {
      const sooner = entry[1].at <= end && (!earliest || entry[1].at < earliest[1].at);
      if (sooner) earliest = entry;
    }
    return earliest;
  }
}
