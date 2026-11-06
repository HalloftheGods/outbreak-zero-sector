import { describe, expect, it } from 'vitest';
import { advance, chooseMode, PLAY_JOIN, PLAY_START, playHeading, retreat, showsServer, startsRun } from '../src/game/play-flow.ts';

describe('play flow', () => {
  it('opens on step 1 (how you play) as solo, with no server field', () => {
    expect(PLAY_START).toEqual({ step: 'mode', mode: 'solo' });
    expect(showsServer(PLAY_START)).toBe(false);
  });

  it('shows the server address on step 1 once Multiplayer is chosen, and on no later step', () => {
    const multi = chooseMode(PLAY_START, 'multi');
    expect(showsServer(multi)).toBe(true);
    expect(showsServer(advance(multi))).toBe(false);
    expect(showsServer(advance(advance(multi)))).toBe(false);
  });

  it('lands an invite link on the co-op setup step', () => {
    expect(PLAY_JOIN).toEqual({ step: 'mode', mode: 'multi' });
    expect(showsServer(PLAY_JOIN)).toBe(true);
  });

  it('walks mode, difficulty, survivor and stays on the last, keeping the mode', () => {
    const second = advance(chooseMode(PLAY_START, 'multi'));
    expect(second).toEqual({ step: 'difficulty', mode: 'multi' });
    const third = advance(second);
    expect(third).toEqual({ step: 'who', mode: 'multi' });
    expect(advance(third)).toBe(third);
  });

  it('goes back one step at a time, then leaves', () => {
    const third = advance(advance(PLAY_START));
    expect(retreat(third)).toEqual({ step: 'difficulty', mode: 'solo' });
    expect(retreat(advance(PLAY_START))).toEqual(PLAY_START);
    expect(retreat(PLAY_START)).toBeNull();
  });

  it('puts Start on the survivor step only', () => {
    expect(startsRun(PLAY_START)).toBe(false);
    expect(startsRun(advance(PLAY_START))).toBe(false);
    expect(startsRun(advance(advance(PLAY_START)))).toBe(true);
  });

  it('titles each step', () => {
    expect(playHeading(PLAY_START)).toBe('Play');
    expect(playHeading(advance(PLAY_START))).toBe('Difficulty');
    expect(playHeading(advance(advance(PLAY_START)))).toBe('Choose Survivor');
  });
});
