// What the room host needs from a link and a clock, so the same room runs over Node ws, a WebRTC data channel or a Durable Object.

/** One link to a player, whatever carries it. */
export interface PeerSocket {
  /** True while sends still go out. */
  readonly open: boolean;
  send(text: string): void;
  close(code: number, reason: string): void;
  /** Cuts the link without a closing handshake: Node terminate(), DO close(1001), RTC close(). */
  drop(): void;
  /** False while the link is too far behind to take a frame this size: bufferedAmount on Node and RTC, the ack gate on a DO. */
  canTakeFrame(bytes: number): boolean;
  /** Asks the far end to show it is still there; its answer reaches the host as heard(). A no-op where the link checks itself. */
  probe(): void;
}

/** Timers and time, injected so the host runs on any runtime and a test can drive it by hand. */
export interface HostClock {
  /** Milliseconds, from any fixed start. */
  now(): number;
  /** Runs fn once after ms; the handle is only for cancel. */
  after(ms: number, fn: () => void): unknown;
  cancel(handle: unknown): void;
}
