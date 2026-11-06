import { describe, expect, it } from 'vitest';
import { advance, chooseMode, PLAY_JOIN, PLAY_START, playHeading, retreat, showsServer, startsRun } from '../src/game/play-flow.ts';

describe('play flow', () => {
  it('opens on step 1 (how you play) as solo, with no server field', () => {
    expect(PLAY_START).toEqual({ step: 'how', mode: 'solo' });
    expect(showsServer(PLAY_START)).toBe(false);
  });

  it('shows the server address on step 1 once Multiplayer is chosen, and not on the survivor step', () => {
    const multi = chooseMode(PLAY_START, 'multi');
    expect(showsServer(multi)).toBe(true);
    expect(showsServer(advance(multi))).toBe(false);
    expect(showsServer(PLAY_START)).toBe(false);
  });

  it('lands an invite link on the co-op setup step', () => {
    expect(PLAY_JOIN).toEqual({ step: 'how', mode: 'multi' });
    expect(showsServer(PLAY_JOIN)).toBe(true);
  });

  it('advances from step 1 to step 2 and stays there, keeping the mode', () => {
    const second = advance(chooseMode(PLAY_START, 'multi'));
    expect(second).toEqual({ step: 'who', mode: 'multi' });
    expect(advance(second)).toBe(second);
  });

  it('goes back one step, then leaves', () => {
    const second = advance(PLAY_START);
    expect(retreat(second)).toEqual(PLAY_START);
    expect(retreat(PLAY_START)).toBeNull();
  });

  it('puts Start on the survivor step only', () => {
    expect(startsRun(PLAY_START)).toBe(false);
    expect(startsRun(advance(PLAY_START))).toBe(true);
  });

  it('titles each step', () => {
    expect(playHeading(PLAY_START)).toBe('Play');
    expect(playHeading(advance(PLAY_START))).toBe('Choose Survivor');
  });
});
