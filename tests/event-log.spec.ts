import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../shared/protocol.ts';
import { bannerLine, calloutLine, eventLine, EventLog, filterLog, levelLines } from '../src/game/event-log.ts';
import type { LogContext } from '../src/game/event-log.ts';

const ctx: LogContext = { localId: 'me', nameOf: (id) => (id === 'pal' ? 'Rex' : null) };

describe('event log', () => {
  it('stamps each line with the run clock, from the first line', () => {
    const log = new EventLog();
    log.add({ text: 'HORDE 1', tone: 'danger', kind: 'fight' }, 10_000);
    const lines = log.add({ text: 'SUPPLY DROP', tone: 'hope', kind: 'night' }, 10_000 + 75_000);
    expect(lines.map((line) => line.at)).toEqual(['0:00', '1:15']);
  });

  it('counts a repeat on the last line instead of adding one', () => {
    const log = new EventLog();
    log.add(calloutLine({ text: 'CLOSE CALL', tone: 'close' }), 0);
    log.add(calloutLine({ text: 'CLOSE CALL', tone: 'close' }), 2000);
    const lines = log.add(calloutLine({ text: 'CLOSE CALL', tone: 'close' }), 4000);
    expect(lines).toHaveLength(1);
    expect(lines[0].count).toBe(3);
    expect(lines[0].at).toBe('0:04');
  });

  it('starts a new line when the repeat comes late or something else came between', () => {
    const log = new EventLog();
    log.add(calloutLine({ text: 'DOUBLE', tone: 'chain' }), 0);
    log.add(calloutLine({ text: 'DOUBLE', tone: 'chain' }), 30_000);
    log.add({ text: '+12 SHELLS', tone: 'plain', kind: 'loot' }, 31_000);
    expect(log.add(calloutLine({ text: 'DOUBLE', tone: 'chain' }), 32_000)).toHaveLength(4);
  });

  it('forgets the last run on reset', () => {
    const log = new EventLog();
    log.add({ text: 'A', tone: 'plain', kind: 'night' }, 0);
    log.reset();
    const lines = log.add({ text: 'B', tone: 'plain', kind: 'night' }, 99_000);
    expect(lines.map((line) => [line.text, line.at])).toEqual([['B', '0:00']]);
  });

  it('sorts banners and callouts into tabs', () => {
    expect(bannerLine({ title: 'HORDE 2', subtitle: '30 HOSTILES', tone: 'danger' }).kind).toBe('fight');
    expect(bannerLine({ title: 'HORDE WIPED OUT', subtitle: 'FOR NOW', tone: 'quiet' }).kind).toBe('fight');
    expect(bannerLine({ title: 'SUPPLY DROP', subtitle: 'FOLLOW THE RED FLARE', tone: 'hope' }).kind).toBe('night');
    expect(calloutLine({ text: 'STAMP: FIRST BLOOD', tone: 'stamp' }).kind).toBe('night');
    expect(calloutLine({ text: 'TRIPLE', tone: 'chain' }).kind).toBe('fight');
  });

  it('logs only your own pickups, and names teammates in trouble', () => {
    const mine: GameEvent = { type: 'pickup', playerId: 'me', pickup: 'shells', x: 0, y: 0 };
    const theirs: GameEvent = { type: 'pickup', playerId: 'pal', pickup: 'shells', x: 0, y: 0 };
    expect(eventLine(mine, { ...ctx, pickupNote: '+6 SHELLS' })).toMatchObject({ text: '+6 SHELLS', kind: 'loot' });
    expect(eventLine(theirs, { ...ctx, pickupNote: '+6 SHELLS' })).toBeNull();
    expect(eventLine({ type: 'player_downed', playerId: 'pal', x: 0, y: 0 }, ctx)).toMatchObject({ text: 'REX IS DOWN', kind: 'team' });
    expect(eventLine({ type: 'player_revived', playerId: 'me', x: 0, y: 0 }, ctx)?.text).toBe('YOU ARE BACK UP');
    expect(eventLine({ type: 'shot', playerId: 'me', weapon: 'pistol', x: 0, y: 0, angle: 0 }, ctx)).toBeNull();
  });

  it('gives the title card a line for the town and one for each warning', () => {
    const lines = levelLines({ heading: 'Level 3 of 10', title: 'Crawlspace', goal: 'Survive 3 hordes, then reach the van', event: 'Blackout. No lights.' });
    expect(lines.map((line) => line.text)).toEqual(['CRAWLSPACE', 'BLACKOUT. NO LIGHTS.']);
  });

  it('filters by tab', () => {
    const log = new EventLog();
    log.add({ text: 'A', tone: 'plain', kind: 'loot' }, 0);
    log.add({ text: 'B', tone: 'plain', kind: 'fight' }, 0);
    expect(filterLog(log.entries, 'loot').map((line) => line.text)).toEqual(['A']);
    expect(filterLog(log.entries, 'all')).toHaveLength(2);
  });
});
