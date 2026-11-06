import { describe, expect, it } from 'vitest';
import { allTracks } from '../src/audio/playlists.ts';
import { JUKEBOX_PAGE, jukeboxFacts, jukeboxPlate, pageCount, pageOf, pageTracks, slotsOf } from '../src/game/home/jukebox-view.ts';
import { ITEM_SLOTS } from '../src/game/home/shop-item-facts.ts';
import { NO_PROGRESS } from '../src/game/level-progress.ts';
import { musicEntries } from '../src/game/sound-test.ts';
import type { MusicEntry } from '../src/game/sound-test.ts';

const entries = musicEntries(NO_PROGRESS, 'campaign', new Set());
const track = entries[0] as MusicEntry;

describe('jukebox view (#7210)', () => {
  it('puts the playing track and where it is heard on the plate, and a prompt while stopped', () => {
    expect(jukeboxPlate(null)).toEqual({ name: 'Choose a track', line: 'Nothing playing' });
    expect(jukeboxPlate(track)).toEqual({ name: track.name, line: `Now playing: ${track.where}` });
  });

  it('lights cells for a share of the whole, none for nothing and all for everything', () => {
    expect(slotsOf(0, 34)).toBe(0);
    expect(slotsOf(1, 34)).toBe(1);
    expect(slotsOf(34, 34)).toBe(ITEM_SLOTS);
    expect(slotsOf(3, 0)).toBe(0);
  });

  it('lists tracks, finds and what plays, read off the counts it is given', () => {
    const rows = jukeboxFacts({ unlocked: 12, total: 50, found: 3, finds: 34 }, track);
    expect(rows.map((row) => [row.label, row.value])).toEqual([
      ['Tracks', '12 of 50'],
      ['Radio finds', '3 of 34'],
      ['Playing', track.name],
    ]);
    expect(rows[2].filled).toBeNull();
    expect(jukeboxFacts({ unlocked: 1, total: 1, found: 0, finds: 0 }, null)[2].value).toBe('Nothing');
  });

  it('pages the whole real track list without a scrolling strip', () => {
    const all = allTracks('campaign').length;
    const pages = pageCount(all);
    expect(pages).toBe(Math.ceil(all / JUKEBOX_PAGE));
    const seen = Array.from({ length: pages }, (_, page) => pageTracks(entries, page)).flat();
    expect(seen).toEqual(entries);
    expect(pageCount(0)).toBe(1);
  });

  it('finds the page a tile is on', () => {
    expect(pageOf(0)).toBe(0);
    expect(pageOf(JUKEBOX_PAGE - 1)).toBe(0);
    expect(pageOf(JUKEBOX_PAGE)).toBe(1);
  });
});
