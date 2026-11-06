import { describe, expect, it } from 'vitest';
import { mapKey } from '../src/game/map-key.ts';
import { BUNKER_LEGEND, TOWN_LEGEND } from '../src/game/town-map.ts';

describe('the map key', () => {
  it('calls the town a town map and lists the town legend with its check and cross marks', () => {
    const key = mapKey(false);
    expect(key.title).toBe('Town map');
    expect(key.legend).toBe(TOWN_LEGEND);
    expect(key.marks).toBe(true);
  });

  it('calls the bunker a bunker map, with no town legend and no town marks', () => {
    const key = mapKey(true);
    expect(key.title).toBe('Bunker map');
    expect(key.legend).toBe(BUNKER_LEGEND);
    expect(key.legend.map(([, label]) => label)).toEqual(['Stations']);
    expect(key.marks).toBe(false);
    expect(JSON.stringify(key)).not.toMatch(/town|van|medical|police/i);
  });

  it('says the run waits for a solo player and goes on for a room', () => {
    expect(mapKey(false).waitNote('solo')).toBe('Paused.');
    expect(mapKey(false).waitNote('coop')).toBe('The town does not wait.');
    expect(mapKey(true).waitNote('solo')).toBe('Paused.');
    expect(mapKey(true).waitNote('coop')).toBe('The bunker does not wait.');
  });
});
