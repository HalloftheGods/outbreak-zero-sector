// A small drawing board for the placeholder style cards: shapes in, CardDef rows out.

import { CARD_H, CARD_W } from '../difficulty-card.ts';

export class Grid {
  private readonly cells: string[][];

  constructor(fill: string) {
    this.cells = Array.from({ length: CARD_H }, () => Array.from({ length: CARD_W }, () => fill));
  }

  private put(x: number, y: number, letter: string): void {
    const onBoard = x >= 0 && x < CARD_W && y >= 0 && y < CARD_H;
    if (onBoard) this.cells[y][x] = letter;
  }

  rect(x: number, y: number, w: number, h: number, letter: string): this {
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) this.put(col, row, letter);
    return this;
  }

  /** A filled circle of whole pixels. */
  disc(cx: number, cy: number, r: number, letter: string): this {
    for (let row = cy - r; row <= cy + r; row++) {
      for (let col = cx - r; col <= cx + r; col++) {
        const inside = (col - cx) ** 2 + (row - cy) ** 2 <= r * r + r / 2;
        if (inside) this.put(col, row, letter);
      }
    }
    return this;
  }

  rows(): readonly string[] {
    return this.cells.map((line) => line.join(''));
  }
}
