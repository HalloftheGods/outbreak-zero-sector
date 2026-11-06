/** After a stall, drop the backlog rather than fast-forward the world. */
export const MAX_LAG_MS = 250;
export const MAX_CATCH_UP_TICKS = 3;
export const HEARTBEAT_MS = 10000;
export const MAX_PACKET_BYTES = 2048;
/** A few snapshots: past this a client skips frames rather than falling further behind, and its pings still get through. */
export const MAX_BUFFERED_BYTES = 1 << 15;
export const ROOM_FULL_CODE = 4000;
export const SERVER_BUSY_CODE = 4001;
export const JOIN_TIMEOUT_CODE = 4002;
/** A socket that has not joined by then is closed. */
export const JOIN_DEADLINE_MS = 10000;
/** Sockets allowed to sit unjoined at once; a real player is only here for a moment. */
export const MAX_UNJOINED_SOCKETS = 16;
/** The share of those one address can hold, so a single machine cannot lock everyone else out. */
export const MAX_UNJOINED_PER_ADDRESS = 4;
/** How long the first Play Again waits for the rest, so a hidden tab cannot hold the room for ever. */
export const RESTART_VOTE_MS = 15000;
/** Packets a client may send each second. The game sends 30, so only a flood ever runs dry. */
export const PACKETS_PER_SEC = 120;
/** What a client can send at once after a quiet spell, which covers a stall on its side. */
export const PACKET_BURST = 240;

export interface PacketBudget {
  /** Packets it may still send, refilled with time. */
  packetAllowance: number;
  allowanceAt: number;
}

/** Spends one packet from the client's allowance. False means drop it unread. */
export function takePacketAllowance(client: PacketBudget, now: number): boolean {
  const refill = ((now - client.allowanceAt) / 1000) * PACKETS_PER_SEC;
  client.packetAllowance = Math.min(PACKET_BURST, client.packetAllowance + refill);
  client.allowanceAt = now;
  if (client.packetAllowance < 1) return false;
  client.packetAllowance -= 1;
  return true;
}
