import { describe, expect, it } from 'vitest';
import { buildArtBook } from '../src/art/index.ts';
import { HOW_TO_SECTIONS } from '../src/game/how-to-play.ts';
import { getSectionVisuals } from '../src/game/how-to-play-visuals.ts';

describe('how-to-play visuals', () => {
  it('returns valid VisualCards with real PixelSprites for all 12 sections', () => {
    const art = buildArtBook();
    for (const section of HOW_TO_SECTIONS) {
      const cards = getSectionVisuals(section.id, art);
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.id).toBeTruthy();
        expect(card.title).toBeTruthy();
        expect(card.sprite).toBeDefined();
        expect(card.sprite.w).toBeGreaterThan(0);
        expect(card.sprite.h).toBeGreaterThan(0);
        expect(card.sprite.rgba.length).toBe(card.sprite.w * card.sprite.h * 4);
      }
    }
  });
});
