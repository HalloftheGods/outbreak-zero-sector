export const TARGET_VIEW_W = 480;
export const TARGET_VIEW_H = 270;

export interface Viewport {
  /** Device pixels per art pixel. Always a whole number. */
  readonly scale: number;
  /** The back buffer, in art pixels. */
  readonly bufferW: number;
  readonly bufferH: number;
  /** CSS size of the canvas: the buffer at scale, a touch past the window edge when ceil rounded up. */
  readonly cssW: number;
  readonly cssH: number;
  readonly dpr: number;
}

export function computeViewport(cssW: number, cssH: number, dpr: number): Viewport {
  const scale = Math.max(1, Math.round(Math.min(cssW / TARGET_VIEW_W, cssH / TARGET_VIEW_H) * dpr));
  const bufferW = Math.max(1, Math.ceil((cssW * dpr) / scale));
  const bufferH = Math.max(1, Math.ceil((cssH * dpr) / scale));
  return { scale, bufferW, bufferH, cssW: (bufferW * scale) / dpr, cssH: (bufferH * scale) / dpr, dpr };
}

/** CSS pixels per UI unit, so the Vue overlay grows in step with the game. */
export function uiUnit(cssW: number, cssH: number): number {
  return Math.max(1.5, Math.round(Math.min(cssW / TARGET_VIEW_W, cssH / TARGET_VIEW_H)) / 2);
}
