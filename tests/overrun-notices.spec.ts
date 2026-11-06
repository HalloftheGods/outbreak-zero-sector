import { describe, expect, it } from 'vitest';
import type { OverrunView } from '../shared/home-protocol.ts';
import { overrunClockLine } from '../src/game/overrun-hud.ts';
import { overrunBanner } from '../src/game/run-notices.ts';

const view = (patch: Partial<OverrunView> = {}): OverrunView => ({ phase: 'counting', left: 300, slowed: false, hostiles: 0, total: 0, ...patch });

describe('overrun banners', () => {
  it('words each warning step with the time left', () => {
    const steps = [150, 75, 30].map((left, step) => overrunBanner({ type: 'overrun_warning', step, left }));
    expect(steps.map((b) => b?.subtitle)).toEqual(['2:30 LEFT', '1:15 LEFT', '0:30 LEFT']);
    expect(new Set(steps.map((b) => b?.title)).size).toBe(3);
    expect(steps.every((b) => b?.tone === 'danger')).toBe(true);
  });

  it('counts the hostiles at the breach', () => {
    expect(overrunBanner({ type: 'overrun_breach', hostiles: 12 })).toEqual({ title: 'OVERRUN', subtitle: '12 HOSTILES', tone: 'danger' });
  });

  it('tells a held bunker from a fallen one', () => {
    expect(overrunBanner({ type: 'overrun_end', outcome: 'held' })?.tone).toBe('hope');
    expect(overrunBanner({ type: 'overrun_end', outcome: 'lost' })?.title).toBe('THE BUNKER FELL');
  });

  it('says nothing for other events', () => {
    expect(overrunBanner({ type: 'wave_clear', wave: 1 })).toBeNull();
  });
});

describe('overrun clock line', () => {
  it('has nothing without an overrun', () => {
    expect(overrunClockLine(null)).toBeNull();
  });

  it('shows the time to the door and the slowed tag', () => {
    expect(overrunClockLine(view({ left: 299.2 }))).toMatchObject({ label: 'BLAST DOOR', value: '5:00', slowed: false, urgent: false });
    expect(overrunClockLine(view({ left: 120, slowed: true }))?.slowed).toBe(true);
  });

  it('turns urgent once armed and shows hostiles once breached', () => {
    expect(overrunClockLine(view({ phase: 'armed', left: 20 }))?.urgent).toBe(true);
    expect(overrunClockLine(view({ phase: 'breached', left: 0, hostiles: 7, total: 9, slowed: true }))).toMatchObject({ label: 'HOSTILES', value: '7', slowed: false });
  });

  it('goes quiet when the overrun is settled', () => {
    expect(overrunClockLine(view({ phase: 'held', left: 0 }))).toBeNull();
  });
});
