import { describe, expect, it } from 'vitest';
import { advance, chooseMode, PLAY_START, playHeading, retreat, showsServer } from '../src/game/play-flow.ts';

describe('play flow', () => {
  it('opens on step 1 (who you are) as solo, with no server field', () => {
    expect(PLAY_START).toEqual({ step: 'who', mode: 'solo' });
    expect(showsServer(PLAY_START)).toBe(false);
  });

  it('shows the server address on step 2 once Multiplayer is chosen', () => {
    const multi = chooseMode(PLAY_START, 'multi');
    expect(showsServer(multi)).toBe(false);
    expect(showsServer(advance(multi))).toBe(true);
    expect(showsServer(advance(PLAY_START))).toBe(false);
  });

  it('advances from step 1 to step 2 and stays there, keeping the mode', () => {
    const second = advance(chooseMode(PLAY_START, 'multi'));
    expect(second).toEqual({ step: 'how', mode: 'multi' });
    expect(advance(second)).toBe(second);
  });

  it('goes back one step, then leaves', () => {
    const second = advance(PLAY_START);
    expect(retreat(second)).toEqual(PLAY_START);
    expect(retreat(PLAY_START)).toBeNull();
  });

  it('titles each step', () => {
    expect(playHeading(PLAY_START)).toBe('Survivor');
    expect(playHeading(advance(PLAY_START))).toBe('Play');
  });
});
