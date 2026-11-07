// Six icon emotes stand in for chat: no text ever crosses the wire, only one of these ids.

export const EMOTE_IDS = ['help', 'go', 'thanks', 'wait', 'danger', 'nice'] as const;

export type EmoteId = (typeof EMOTE_IDS)[number];

export function isEmoteId(value: unknown): value is EmoteId {
  return typeof value === 'string' && (EMOTE_IDS as readonly string[]).includes(value);
}

/** How long an emote stays over its survivor. */
export const EMOTE_SHOW_SEC = 2;
/** One emote a player every this many seconds, once the burst is spent. */
export const EMOTE_GAP_SEC = 1.5;
/** What a player may send at once after a quiet spell. */
export const EMOTE_BURST = 3;

/** What each player carries so the room can pace their emotes. */
export interface EmoteBudget {
  emoteTokens: number;
  emoteAt: number;
}

export const freshEmoteBudget = (): EmoteBudget => ({ emoteTokens: EMOTE_BURST, emoteAt: 0 });

/** Spends one emote from the player's allowance at `now` seconds. False means drop it. */
export function takeEmote(budget: EmoteBudget, now: number): boolean {
  const refill = Math.max(0, now - budget.emoteAt) / EMOTE_GAP_SEC;
  budget.emoteTokens = Math.min(EMOTE_BURST, budget.emoteTokens + refill);
  budget.emoteAt = now;
  const spent = budget.emoteTokens < 1;
  if (!spent) budget.emoteTokens -= 1;
  return !spent;
}
