// Procedural pixel preview thumbnails for each level. Pure data/canvas, 64x36 pixels.
// Uses strict palette colors from RAMPS to mirror each level's look, lighting and weather.

import { PixelCanvas } from './kit.ts';
import { RAMPS } from './palette.ts';
import type { PixelSprite } from './types.ts';

const { acid, ash, asphalt, blood, bone, brick, concrete, denim, fire, ink, metal, rot, teal, violet, wood } = RAMPS;

export const THUMB_W = 64;
export const THUMB_H = 36;

const thumbnailCache = new Map<string, PixelSprite>();

/** Renders a padlock icon centered on a locked thumbnail. */
function drawLockIcon(canvas: PixelCanvas): void {
  const cx = Math.floor(THUMB_W / 2);
  const cy = Math.floor(THUMB_H / 2);
  // Padlock shackle
  canvas.frame(cx - 4, cy - 7, 9, 6, bone[1]);
  // Shackle cut to body
  canvas.px(cx - 4, cy - 2, ink[0]);
  canvas.px(cx + 4, cy - 2, ink[0]);
  // Padlock body
  canvas.rect(cx - 6, cy - 2, 13, 10, bone[0]);
  canvas.frame(cx - 6, cy - 2, 13, 10, ink[0]);
  // Keyhole
  canvas.px(cx, cy + 1, ink[0]);
  canvas.line(cx, cy + 2, cx, cy + 4, ink[0]);
}

/** Draws common ground and pavement line. */
function drawGround(canvas: PixelCanvas, groundColor: number, curbColor: number): void {
  canvas.rect(0, 28, THUMB_W, 8, groundColor);
  canvas.line(0, 27, THUMB_W - 1, 27, curbColor);
}

/** Level 1: Silent Ruins - Clear night, quiet ruins, streetlight glow. */
function renderSilentRuins(canvas: PixelCanvas): void {
  canvas.rect(0, 0, THUMB_W, 28, denim[0]);
  // Distant stars / specs
  canvas.px(8, 5, bone[3]);
  canvas.px(22, 9, bone[2]);
  canvas.px(48, 4, bone[3]);
  canvas.px(57, 11, bone[2]);
  // Building silhouettes
  canvas.rect(4, 11, 14, 16, asphalt[2]);
  canvas.rect(20, 7, 16, 20, ink[1]);
  canvas.rect(38, 14, 12, 13, asphalt[2]);
  canvas.rect(52, 9, 10, 18, ink[1]);
  // Windows
  canvas.px(24, 11, fire[2]);
  canvas.px(28, 11, fire[2]);
  canvas.px(24, 17, fire[1]);
  // Ground
  drawGround(canvas, asphalt[0], asphalt[2]);
  // Street lamp
  canvas.line(46, 17, 46, 27, metal[2]);
  canvas.rect(44, 16, 5, 2, metal[3]);
  canvas.px(46, 18, fire[3]);
  // Faint cone of light
  canvas.line(42, 27, 50, 27, fire[1]);
  // Walker silhouette
  canvas.rect(48, 23, 2, 4, rot[1]);
  canvas.px(48, 22, rot[2]);
}

/** Level 2: Escalation - Urban alleyway, denser skyline, runner lurking. */
function renderEscalation(canvas: PixelCanvas): void {
  canvas.rect(0, 0, THUMB_W, 28, ink[1]);
  // Tall urban canyon
  canvas.rect(0, 4, 18, 24, brick[0]);
  canvas.rect(14, 2, 8, 26, brick[1]);
  canvas.rect(42, 6, 22, 22, brick[0]);
  canvas.rect(38, 10, 8, 18, brick[1]);
  // Fire escapes
  for (let y = 8; y <= 20; y += 4) {
    canvas.line(38, y, 44, y, metal[2]);
  }
  // Windows
  canvas.rect(6, 8, 3, 3, fire[2]);
  canvas.rect(6, 16, 3, 3, denim[2]);
  canvas.rect(48, 12, 3, 3, fire[1]);
  drawGround(canvas, asphalt[0], concrete[1]);
  // Barricade
  canvas.rect(26, 25, 8, 3, wood[2]);
  // Runner silhouette
  canvas.rect(30, 22, 2, 3, blood[2]);
  canvas.px(31, 21, blood[3]);
}

/** Level 3: Into the Breach - Industrial dusk, smokestacks, soot particles. */
function renderIndustrialDusk(canvas: PixelCanvas): void {
  // Gradient dusk sky
  canvas.rect(0, 0, THUMB_W, 10, wood[1]);
  canvas.rect(0, 10, THUMB_W, 10, brick[1]);
  canvas.rect(0, 20, THUMB_W, 8, fire[0]);
  // Factory sawtooth roofs & chimneys
  canvas.rect(8, 9, 12, 19, ink[0]);
  canvas.rect(12, 3, 4, 6, ink[0]);
  canvas.rect(26, 13, 14, 15, asphalt[1]);
  canvas.rect(44, 7, 16, 21, ink[0]);
  canvas.rect(52, 2, 3, 5, ink[0]);
  // Soot smoke
  canvas.px(13, 1, ash[1]);
  canvas.px(14, 0, ash[0]);
  canvas.px(53, 0, ash[1]);
  // Floating soot flakes
  canvas.px(4, 7, ash[0]);
  canvas.px(22, 14, ash[0]);
  canvas.px(37, 8, ash[1]);
  canvas.px(42, 22, ash[0]);
  drawGround(canvas, asphalt[1], concrete[2]);
}

/** Level 4: Abyssal Depths - Flooded streets, dark teal rainstorm, water ripples. */
function renderFlooded(canvas: PixelCanvas): void {
  canvas.rect(0, 0, THUMB_W, 24, teal[0]);
  // Submerged buildings
  canvas.rect(6, 8, 14, 16, denim[0]);
  canvas.rect(24, 12, 16, 12, ink[1]);
  canvas.rect(44, 6, 14, 18, denim[0]);
  // Diagonal rain streaks
  for (let x = 3; x < THUMB_W; x += 9) {
    canvas.line(x, 2, x + 3, 10, denim[2]);
    canvas.line(x + 4, 14, x + 7, 22, denim[1]);
  }
  // Flooded water body with ripples
  canvas.rect(0, 24, THUMB_W, 12, teal[0]);
  canvas.line(0, 24, THUMB_W - 1, 24, teal[1]);
  canvas.line(8, 27, 24, 27, teal[2]);
  canvas.line(32, 29, 52, 29, teal[1]);
  canvas.line(16, 32, 38, 32, teal[2]);
}

/** Level 5: Contamination Zone - Toxic green chemical plant, bio-luminescence. */
function renderContaminated(canvas: PixelCanvas): void {
  // Toxic green sky
  canvas.rect(0, 0, THUMB_W, 14, rot[0]);
  canvas.rect(0, 14, THUMB_W, 14, rot[1]);
  // Chemical tanks & pipe silos
  canvas.rect(6, 10, 12, 18, asphalt[2]);
  canvas.ellipse(12, 10, 6, 2, asphalt[2]);
  canvas.rect(22, 6, 6, 22, metal[1]);
  canvas.rect(34, 13, 16, 15, asphalt[1]);
  canvas.rect(54, 8, 8, 20, metal[1]);
  // Pipes
  canvas.line(18, 16, 22, 16, metal[2]);
  // Bio-spores
  canvas.px(10, 5, acid[2]);
  canvas.px(28, 10, acid[1]);
  canvas.px(42, 4, acid[2]);
  canvas.px(50, 16, acid[2]);
  drawGround(canvas, rot[0], acid[1]);
  // Toxic sludge puddle
  canvas.ellipse(28, 31, 8, 2, acid[2]);
}

/** Level 6: Blackout - dark tunnels, faint emergency lamp, red eyes. */
function renderBlackout(canvas: PixelCanvas): void {
  canvas.fill(ink[0]);
  // Bunker archway
  canvas.line(10, 27, 10, 12, concrete[1]);
  canvas.line(10, 12, 24, 5, concrete[1]);
  canvas.line(24, 5, 40, 5, concrete[1]);
  canvas.line(40, 5, 54, 12, concrete[1]);
  canvas.line(54, 12, 54, 27, concrete[1]);
  // Concrete ribs
  canvas.line(14, 27, 14, 14, concrete[0]);
  canvas.line(50, 27, 50, 14, concrete[0]);
  // Dangling single bulb
  canvas.line(32, 5, 32, 11, metal[1]);
  canvas.px(32, 12, bone[3]);
  // Faint cone
  canvas.line(30, 14, 34, 14, denim[1]);
  canvas.line(26, 27, 38, 27, denim[0]);
  // Glowing red eyes in the shadows
  canvas.px(18, 21, fire[0]);
  canvas.px(20, 21, fire[0]);
  canvas.px(46, 23, fire[0]);
  canvas.px(48, 23, fire[0]);
  drawGround(canvas, ink[1], concrete[0]);
}

/** Level 7: Quarantine Breach - Crimson emergency strobe, razor wire, military barrier. */
function renderEmergency(canvas: PixelCanvas): void {
  canvas.rect(0, 0, THUMB_W, 28, blood[0]);
  // Watchtower / military checkpoint
  canvas.rect(6, 6, 14, 22, ink[0]);
  canvas.rect(4, 4, 18, 3, asphalt[2]);
  // Searchlight beam
  canvas.line(12, 7, 36, 27, blood[3]);
  canvas.line(13, 7, 40, 27, blood[2]);
  // Concrete barricades
  canvas.rect(26, 22, 12, 6, concrete[2]);
  canvas.rect(42, 22, 12, 6, concrete[2]);
  // Razor wire cross coils
  for (let x = 24; x <= 56; x += 4) {
    canvas.px(x, 21, metal[3]);
  }
  drawGround(canvas, asphalt[0], blood[2]);
  // Warning beacon
  canvas.px(13, 3, fire[3]);
}

/** Level 8: Frozen Wasteland - Blizzard twilight, snowbanks, wind-drift snow. */
function renderSnow(canvas: PixelCanvas): void {
  // Pale frozen blue sky
  canvas.rect(0, 0, THUMB_W, 28, denim[1]);
  // Snow-covered roofs
  canvas.rect(6, 12, 16, 16, denim[0]);
  canvas.rect(6, 11, 16, 2, bone[3]);
  canvas.rect(26, 8, 14, 20, ink[1]);
  canvas.rect(26, 7, 14, 2, bone[3]);
  canvas.rect(44, 14, 14, 14, denim[0]);
  canvas.rect(44, 13, 14, 2, bone[3]);
  // Snow ground
  drawGround(canvas, bone[2], bone[3]);
  // Blowing blizzard snowflakes
  const flakes: readonly [number, number][] = [
    [4, 6], [12, 14], [18, 3], [24, 19], [32, 9], [38, 24], [46, 5], [52, 16], [58, 22], [10, 27], [35, 30],
  ];
  for (const [fx, fy] of flakes) {
    canvas.px(fx, fy, bone[3]);
  }
}

/** Level 9: The Hive - Violet alien sky, bio-mass creep, pulsing pustules. */
function renderInfested(canvas: PixelCanvas): void {
  canvas.rect(0, 0, THUMB_W, 28, violet[0]);
  // Decayed organic building shells
  canvas.rect(6, 9, 14, 19, ink[0]);
  canvas.rect(24, 6, 16, 22, ink[0]);
  canvas.rect(44, 11, 14, 17, ink[0]);
  // Fungal creep climbing
  canvas.line(8, 27, 12, 14, violet[1]);
  canvas.line(26, 27, 30, 10, violet[1]);
  canvas.line(48, 27, 46, 16, violet[1]);
  // Bio-luminescent purple spore pustules
  canvas.px(12, 14, violet[2]);
  canvas.px(13, 14, bone[3]);
  canvas.px(30, 10, violet[2]);
  canvas.px(31, 10, bone[3]);
  canvas.px(46, 16, violet[2]);
  // Airborne spore motes
  canvas.px(16, 6, violet[2]);
  canvas.px(38, 4, violet[2]);
  canvas.px(54, 8, violet[2]);
  drawGround(canvas, violet[0], violet[1]);
}

/** Level 10: Final Stand - Inferno firestorm, burning collapsed ruins, raging embers. */
function renderBurning(canvas: PixelCanvas): void {
  // Fiery gradient sky
  canvas.rect(0, 0, THUMB_W, 8, fire[0]);
  canvas.rect(0, 8, THUMB_W, 10, fire[1]);
  canvas.rect(0, 18, THUMB_W, 10, fire[2]);
  // Crumbling burning ruins
  canvas.rect(6, 12, 14, 16, ink[0]);
  canvas.rect(24, 15, 18, 13, wood[0]);
  canvas.rect(46, 9, 12, 19, ink[0]);
  // Inferno flames & fire barrel
  canvas.rect(30, 22, 6, 6, fire[1]);
  canvas.px(31, 20, fire[2]);
  canvas.px(32, 19, fire[3]);
  canvas.px(33, 20, fire[2]);
  canvas.px(34, 18, fire[3]);
  // Rising burning embers
  const embers: readonly [number, number][] = [
    [10, 6], [14, 14], [22, 9], [28, 4], [32, 12], [36, 7], [42, 15], [50, 6], [56, 11],
  ];
  for (const [ex, ey] of embers) {
    canvas.px(ex, ey, fire[2]);
  }
  drawGround(canvas, asphalt[0], fire[1]);
}

/** Locked blueprint / classified level preview. */
function renderLocked(canvas: PixelCanvas): void {
  // Dark silhouette background
  canvas.fill(ink[0]);
  // Scanlines / grid
  for (let y = 0; y < THUMB_H; y += 4) {
    canvas.line(0, y, THUMB_W - 1, y, asphalt[1]);
  }
  for (let x = 0; x < THUMB_W; x += 8) {
    canvas.line(x, 0, x, THUMB_H - 1, asphalt[1]);
  }
  // Outer frame
  canvas.frame(0, 0, THUMB_W, THUMB_H, asphalt[2]);
  // Center padlock
  drawLockIcon(canvas);
}

const RENDERERS: Record<number, (canvas: PixelCanvas) => void> = {
  1: renderSilentRuins,
  2: renderEscalation,
  3: renderIndustrialDusk,
  4: renderFlooded,
  5: renderContaminated,
  6: renderBlackout,
  7: renderEmergency,
  8: renderSnow,
  9: renderInfested,
  10: renderBurning,
};

/**
 * Builds or returns a cached PixelSprite preview thumbnail for a level.
 * When locked, returns a dark classified blueprint thumbnail with padlock.
 */
export function buildLevelThumbnail(levelNum: number, unlocked: boolean): PixelSprite {
  const key = unlocked ? `unlocked-${levelNum}` : `locked-${levelNum}`;
  const existing = thumbnailCache.get(key);
  if (existing) return existing;

  const canvas = new PixelCanvas(THUMB_W, THUMB_H);
  if (!unlocked) {
    renderLocked(canvas);
  } else {
    const draw = RENDERERS[levelNum] ?? renderSilentRuins;
    draw(canvas);
    // 1px framing border
    canvas.frame(0, 0, THUMB_W, THUMB_H, ink[0]);
  }

  const sprite = canvas.toSprite(THUMB_W, THUMB_H, 0, 0);
  thumbnailCache.set(key, sprite);
  return sprite;
}

/** Pre-populates all level thumbnails. */
export function buildAllLevelThumbnails(): Record<number, { unlocked: PixelSprite; locked: PixelSprite }> {
  const result: Record<number, { unlocked: PixelSprite; locked: PixelSprite }> = {};
  for (let n = 1; n <= 10; n++) {
    result[n] = {
      unlocked: buildLevelThumbnail(n, true),
      locked: buildLevelThumbnail(n, false),
    };
  }
  return result;
}
