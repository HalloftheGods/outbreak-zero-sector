/** The Play page's three steps: how you play (mode, server, callsign), then the difficulty, then who you are (the survivor, where Start lives). The component only shows the step it is told; every move is decided here. */
export type PlayStep = 'mode' | 'difficulty' | 'who';
export type PlayMode = 'solo' | 'multi';

export interface PlayFlow {
  readonly step: PlayStep;
  readonly mode: PlayMode;
}

/** The steps in the order Next walks them. */
const STEPS: readonly PlayStep[] = ['mode', 'difficulty', 'who'];
const HEADINGS: Record<PlayStep, string> = { mode: 'Play', difficulty: 'Difficulty', who: 'Choose Survivor' };

export const PLAY_START: PlayFlow = { step: 'mode', mode: 'solo' };

/** An invite link lands on the co-op setup step; the callsign is on that step, so nothing is skipped. */
export const PLAY_JOIN: PlayFlow = { step: 'mode', mode: 'multi' };

export function chooseMode(flow: PlayFlow, mode: PlayMode): PlayFlow {
  return { ...flow, mode };
}

/** Enter, or the Next link: one step on, and the last step stays put (starting is the button's job). */
export function advance(flow: PlayFlow): PlayFlow {
  const next = STEPS[STEPS.indexOf(flow.step) + 1];
  return next ? { ...flow, step: next } : flow;
}

/** Back or Esc: one step back, and the first step returns null, meaning leave Play for the title. */
export function retreat(flow: PlayFlow): PlayFlow | null {
  const earlier = STEPS[STEPS.indexOf(flow.step) - 1];
  return earlier ? { ...flow, step: earlier } : null;
}

export function showsServer(flow: PlayFlow): boolean {
  return flow.mode === 'multi' && flow.step === 'mode';
}

/** The Start button belongs to the survivor step, the last one. */
export function startsRun(flow: PlayFlow): boolean {
  return flow.step === 'who';
}

export function playHeading(flow: PlayFlow): string {
  return HEADINGS[flow.step];
}
