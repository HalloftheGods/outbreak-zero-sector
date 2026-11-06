import { describe, expect, it } from 'vitest';
import { fpsBand, scoreBand } from '../src/game/analytics/bands.ts';
import { allowedParams, EVENT_NAMES } from '../src/game/analytics/catalog.ts';
import { errorTypeOf } from '../src/game/analytics/listener.ts';
import { pageLocationOf } from '../src/game/analytics/sender.ts';

describe('analytics catalog', () => {
  it('refuses an event that is not on the list', () => {
    expect(allowedParams('callsign_entered', { callsign: 'ZED' })).toBeNull();
  });

  it('keeps listed values and drops everything else', () => {
    const kept = allowedParams('run_start', {
      survivor: 'rex',
      difficulty: 'lights_out',
      mode: 'coop',
      start_level: 3,
      input: 'touch',
      orientation: 'portrait',
      callsign: 'ZED',
      server: 'ws://10.0.0.5:9000',
      invite: 'https://x.test/?join=10.0.0.5',
    });
    expect(kept).toEqual({ survivor: 'rex', difficulty: 'lights_out', mode: 'coop', start_level: 3, input: 'touch', orientation: 'portrait' });
  });

  it('drops a listed parameter whose value is free text', () => {
    expect(allowedParams('run_start', { survivor: 'ZED the Destroyer', mode: '10.0.0.5:9000' })).toEqual({});
    expect(allowedParams('game_error', { error_type: 'Cannot read properties of undefined' })).toEqual({});
  });

  it('rounds and bounds numbers, and drops anything that is not one', () => {
    const kept = allowedParams('level_complete', {
      level: 2.6,
      seconds: 1e9,
      downs: -4,
      ammo_left: '12',
      shots_fired: Number.NaN,
      kills: 55.4,
      headshots: 12.1,
      damage_taken: 84.8,
      containers_searched: 6.2,
    });
    expect(kept).toEqual({ level: 3, seconds: 86400, downs: 0, kills: 55, headshots: 12, damage_taken: 85, containers_searched: 6 });
  });

  it('keeps known killer types on run_end and drops unlisted attackers', () => {
    expect(allowedParams('run_end', { killer_type: 'runner' })).toEqual({ killer_type: 'runner' });
    expect(allowedParams('run_end', { killer_type: 'giant_boss' })).toEqual({});
  });

  it('has a rule set for every event it names', () => {
    for (const name of EVENT_NAMES) expect(allowedParams(name, {})).toEqual({});
  });

  it('lets the install events through with only their listed source', () => {
    expect(allowedParams('install_prompt', { source: 'guide', ua: 'Safari' })).toEqual({ source: 'guide' });
    expect(allowedParams('install_prompt', { source: 'somewhere else' })).toEqual({});
    expect(allowedParams('app_installed', { source: 'native' })).toEqual({});
  });

  it('bands a score and a frame rate coarsely', () => {
    expect([0, 1, 999, 1000, 9999, 25000].map(scoreBand)).toEqual(['0', '1-999', '1-999', '1000-4999', '5000-9999', '25000+']);
    expect([10, 25, 40, 59, 144].map(fpsBand)).toEqual(['under-20', '20-30', '30-45', '45-60', '60-plus']);
  });

  it('sends the kind of an error and never its message', () => {
    expect(errorTypeOf(new TypeError('secret at /home/me'))).toBe('TypeError');
    const custom = new Error('x');
    custom.name = 'Custom';
    expect(errorTypeOf(custom)).toBe('other');
    expect(errorTypeOf('a string')).toBe('other');
  });

  it('strips the query and hash from the page location', () => {
    expect(pageLocationOf('https://undeadofnight.forthexp.com/play?join=10.0.0.5:9000#top')).toBe('https://undeadofnight.forthexp.com/play');
    expect(pageLocationOf('not a url')).toBe('');
  });
});
