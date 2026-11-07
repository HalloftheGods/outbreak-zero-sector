// Turning the pages of a printed book on the title screens: two leaves at a time on a wide screen, one on a tall one.
// Works on leaf numbers alone, so the Record Book and the changelog share it.

export type BookMode = 'spread' | 'single';

/** The first leaf showing: a spread always opens on an even leaf, so its pair sits together. */
export function firstShown(index: number, mode: BookMode): number {
  return mode === 'spread' ? index - (index % 2) : index;
}

/** The leaves open in front of the reader. */
export function openOf<T>(leaves: readonly T[], index: number, mode: BookMode): readonly T[] {
  const first = firstShown(index, mode);
  return leaves.slice(first, first + (mode === 'spread' ? 2 : 1));
}

/** The leaf a turn lands on, held inside a book of `count` leaves. */
export function turnWithin(count: number, index: number, by: number, mode: BookMode): number {
  const step = mode === 'spread' ? 2 : 1;
  const target = firstShown(index, mode) + by * step;
  return target < 0 || target >= count ? firstShown(index, mode) : target;
}

/** "Pages 1-2 of 4", or "Page 3 of 4" one at a time. */
export function pagesLabel(count: number, index: number, mode: BookMode): string {
  const first = firstShown(index, mode) + 1;
  const last = Math.min(count, first + (mode === 'spread' ? 1 : 0));
  const pages = last > first ? `Pages ${first}-${last}` : `Page ${first}`;
  return `${pages} of ${count}`;
}
