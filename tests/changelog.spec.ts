import { describe, expect, it } from 'vitest';
import { pagesLabel, openOf, turnWithin } from '../src/game/book-turn.ts';
import { CHANGE_NOTES, changeLeaves, notePage, noteDate, NOTES_PER_LEAF } from '../src/game/changelog.ts';

describe('the changelog book', () => {
  it('opens on a front page, then every note two to a page, newest first', () => {
    const leaves = changeLeaves();
    expect(leaves[0].kind).toBe('front');
    const shown = leaves.flatMap((leaf) => (leaf.kind === 'notes' ? leaf.notes : []));
    expect(shown).toEqual(CHANGE_NOTES);
    expect(leaves).toHaveLength(1 + Math.ceil(CHANGE_NOTES.length / NOTES_PER_LEAF));
  });

  it('keeps every note complete and its id unique', () => {
    const ids = new Set(CHANGE_NOTES.map((note) => note.id));
    expect(ids.size).toBe(CHANGE_NOTES.length);
    for (const note of CHANGE_NOTES) {
      expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(note.points.length).toBeGreaterThan(0);
      expect(note.points.length).toBeLessThanOrEqual(4);
    }
  });

  it('a note added at the top lands on page 2 and pushes the rest along', () => {
    const fresh = { id: 'cellars', date: '2026-11-08', kind: 'new' as const, title: 'Cellars', deck: 'Down you go.', points: ['Stairs.'] };
    const notes = [fresh, ...CHANGE_NOTES];
    const leaves = changeLeaves(notes);
    expect(leaves[1].kind === 'notes' && leaves[1].notes[0].id).toBe('cellars');
    expect(notePage('cellars', notes)).toBe(2);
    expect(notePage(CHANGE_NOTES[1].id, notes)).toBe(3);
  });

  it('dates read the way the rest of the game writes them', () => {
    expect(noteDate('2026-11-07')).toBe('7 Nov 2026');
  });
});

describe('turning a book', () => {
  const leaves = ['a', 'b', 'c', 'd', 'e'];
  it('shows pairs on a spread, one on a tall screen, and a lone last page', () => {
    expect(openOf(leaves, 1, 'spread')).toEqual(['a', 'b']);
    expect(openOf(leaves, 4, 'spread')).toEqual(['e']);
    expect(openOf(leaves, 3, 'single')).toEqual(['d']);
    expect(pagesLabel(5, 4, 'spread')).toBe('Page 5 of 5');
    expect(pagesLabel(5, 2, 'spread')).toBe('Pages 3-4 of 5');
  });

  it('stops at the covers', () => {
    expect(turnWithin(5, 4, 1, 'spread')).toBe(4);
    expect(turnWithin(5, 2, 1, 'spread')).toBe(4);
    expect(turnWithin(5, 0, -1, 'single')).toBe(0);
  });
});
