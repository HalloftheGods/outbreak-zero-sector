import { describe, expect, it } from 'vitest';
import { inPalette } from '../src/art/palette.ts';
import { buildAllLevelThumbnails, buildLevelThumbnail, THUMB_H, THUMB_W } from '../src/art/level-thumbnails.ts';

describe('level preview thumbnails', () => {
  it('generates 64x36 PixelSprites for all 10 levels (unlocked and locked)', () => {
    const thumbs = buildAllLevelThumbnails();
    for (let n = 1; n <= 10; n++) {
      const { unlocked, locked } = thumbs[n];
      expect(unlocked.w).toBe(THUMB_W);
      expect(unlocked.h).toBe(THUMB_H);
      expect(unlocked.rgba.length).toBe(THUMB_W * THUMB_H * 4);

      expect(locked.w).toBe(THUMB_W);
      expect(locked.h).toBe(THUMB_H);
      expect(locked.rgba.length).toBe(THUMB_W * THUMB_H * 4);
    }
  });

  it('uses only palette-compliant colors for every pixel', () => {
    for (let n = 1; n <= 10; n++) {
      for (const unlocked of [true, false]) {
        const sprite = buildLevelThumbnail(n, unlocked);
        for (let i = 0; i < sprite.rgba.length; i += 4) {
          const a = sprite.rgba[i + 3];
          if (a === 0) continue;
          const color = (sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2];
          expect(inPalette(color)).toBe(true);
        }
      }
    }
  });
});
