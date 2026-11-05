/** The Play page's two steps: who you are, then how you play. The component only shows the step it is told; every move is decided here. */
export type PlayStep = 'who' | 'how';
export type PlayMode = 'solo' | 'multi';

export interface PlayFlow {
  readonly step: PlayStep;
  readonly mode: PlayMode;
}

export const PLAY_START: PlayFlow = { step: 'who', mode: 'solo' };

export function chooseMode(flow: PlayFlow, mode: PlayMode): PlayFlow {
  return { ...flow, mode };
}

/** Enter, or the Next link: step 1 walks to step 2, and step 2 stays put (starting is the button's job). */
export function advance(flow: PlayFlow): PlayFlow {
  return flow.step === 'who' ? { ...flow, step: 'how' } : flow;
}

/** Back or Esc: step 2 returns to step 1, and step 1 returns null, meaning leave Play for the title. */
export function retreat(flow: PlayFlow): PlayFlow | null {
  return flow.step === 'how' ? { ...flow, step: 'who' } : null;
}

export function showsServer(flow: PlayFlow): boolean {
  return flow.step === 'how' && flow.mode === 'multi';
}

export function playHeading(flow: PlayFlow): string {
  return flow.step === 'who' ? 'Survivor' : 'Play';
}
