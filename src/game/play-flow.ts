/** The Play page's two steps: how you play (mode, server, difficulty, callsign), then who you are (the survivor, where Start lives). The component only shows the step it is told; every move is decided here. */
export type PlayStep = 'how' | 'who';
export type PlayMode = 'solo' | 'multi';

export interface PlayFlow {
  readonly step: PlayStep;
  readonly mode: PlayMode;
}

export const PLAY_START: PlayFlow = { step: 'how', mode: 'solo' };

/** An invite link lands on the co-op setup step; the callsign is on that step, so nothing is skipped. */
export const PLAY_JOIN: PlayFlow = { step: 'how', mode: 'multi' };

export function chooseMode(flow: PlayFlow, mode: PlayMode): PlayFlow {
  return { ...flow, mode };
}

/** Enter, or the Next link: step 1 walks to step 2, and step 2 stays put (starting is the button's job). */
export function advance(flow: PlayFlow): PlayFlow {
  return flow.step === 'how' ? { ...flow, step: 'who' } : flow;
}

/** Back or Esc: step 2 returns to step 1, and step 1 returns null, meaning leave Play for the title. */
export function retreat(flow: PlayFlow): PlayFlow | null {
  return flow.step === 'who' ? { ...flow, step: 'how' } : null;
}

export function showsServer(flow: PlayFlow): boolean {
  return flow.mode === 'multi' && flow.step === 'how';
}

/** The Start button belongs to the survivor step, the last one. */
export function startsRun(flow: PlayFlow): boolean {
  return flow.step === 'who';
}

export function playHeading(flow: PlayFlow): string {
  return flow.step === 'who' ? 'Choose Survivor' : 'Play';
}
