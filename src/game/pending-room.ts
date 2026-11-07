/** A room code that arrived on an invite link (?room=), held until the code join screen takes it. */

let pending: string | null = null;

export function setPendingRoomCode(code: string | null): void {
  pending = code;
}

/** Returns the waiting code once and clears it. */
export function takePendingRoomCode(): string | null {
  const code = pending;
  pending = null;
  return code;
}
