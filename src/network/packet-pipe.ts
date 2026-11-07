/**
 * One text link to a room: a WebSocket to the ws server, or a data channel to a friend's browser.
 * The session speaks packets over it and knows nothing of which kind it holds.
 * A link with no close code of its own (a data channel) maps a `bye` packet to one before it calls `onClose`.
 */
export interface PacketPipe {
  /** What to call the far end in a message to the player, such as the server address. */
  readonly label: string;
  onText: (text: string) => void;
  onClose: (code: number, reason: string) => void;
  /** Starts a link that is not up yet; throws if it cannot. A link that is already up leaves this out. */
  open?(): void;
  /** Sends when the link is up, and drops the text when it is not. */
  send(text: string): void;
  /** Hangs up without calling `onClose`. */
  close(): void;
}
