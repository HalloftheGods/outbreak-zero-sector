// The Solo / Multiplayer step's plain parts: what each card says, and the facts listed beside it, read from the game's rules.

import { MAX_PLAYERS } from '../../shared/constants.ts';
import type { GameStyle } from '../../shared/game-style.ts';
import type { PlayMode } from './play-flow.ts';

export interface ModeCard {
  readonly mode: PlayMode;
  readonly label: string;
  /** One line for the nameplate. */
  readonly line: string;
}

/** One row beside the big card: slotted cells when `filled` is set, else a short value. */
export interface ModeFact {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly filled?: number;
}

/** In roster order. */
export const MODE_CARDS: readonly ModeCard[] = [
  { mode: 'solo', label: 'Solo', line: 'Just you and the night. Pick up where you left off.' },
  { mode: 'multi', label: 'Multiplayer', line: `Up to ${MAX_PLAYERS} survivors in one room, joined by an invite link.` },
];

/** Cells in the Players row: one per seat in a room. */
export const PLAYER_SLOTS = MAX_PLAYERS;

/**
 * Players: the room cap (shared/room/game-room.ts). Difficulty: in co-op the first player into the room sets it (shared/difficulty.ts).
 * Continue and the server field: only solo Arcade offers Continue from level; only co-op needs a server (PlaySetup.vue).
 * Campaign picks up from its bunker save with no Continue button. No style (an invite, where the room decides) says only that Continue is Arcade's.
 */
export function modeFacts(mode: PlayMode, style: GameStyle | null = 'arcade'): readonly ModeFact[] {
  const solo = mode === 'solo';
  const players = solo ? 1 : MAX_PLAYERS;
  const resume = style === 'arcade' ? 'Yes' : 'Arcade only';
  return [
    { key: 'players', label: 'Players', value: String(players), filled: players },
    { key: 'difficulty', label: 'Difficulty', value: solo ? 'Yours' : 'First in' },
    { key: 'continue', label: 'Continue', value: solo ? resume : 'No' },
    { key: 'server', label: 'Server', value: solo ? 'None' : 'Needed' },
  ];
}

/** Where a mode sits in MODE_CARDS, so the roster can mark it chosen. */
export function modeIndex(mode: PlayMode): number {
  return Math.max(0, MODE_CARDS.findIndex((each) => each.mode === mode));
}
