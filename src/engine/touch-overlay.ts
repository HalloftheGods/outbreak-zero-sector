import type { TouchMarks } from './scene.ts';

const INK = '#0b0c10';
const BONE = '#e4dcc3';
const BLOOD = '#c8332a';
const RING_DOTS = 28;
const TICK_LENGTH = 5;
const KNOB_HALF = 4;

/** One tick drawn twice, ink under bone, so it reads over a lit street and a dark one alike. */
function tick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Corners of a box as wide as a fingertip: however the thumb lies, some of them show. */
export function drawFingertipBox(ctx: CanvasRenderingContext2D, x: number, y: number, fingertip: number, onHead: boolean): void {
  const color = onHead ? BLOOD : BONE;
  const reach = Math.round(fingertip);
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (const [sideX, sideY] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cornerX = cx + sideX * reach;
    const cornerY = cy + sideY * reach;
    tick(ctx, sideX < 0 ? cornerX : cornerX - TICK_LENGTH + 1, cornerY, TICK_LENGTH, 1, color);
    tick(ctx, cornerX, sideY < 0 ? cornerY : cornerY - TICK_LENGTH + 1, 1, TICK_LENGTH, color);
  }
}

export function drawStick(ctx: CanvasRenderingContext2D, stick: NonNullable<TouchMarks['stick']>): void {
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = BONE;
  for (let dot = 0; dot < RING_DOTS; dot += 1) {
    const angle = (dot / RING_DOTS) * Math.PI * 2;
    ctx.fillRect(Math.round(stick.baseX + Math.cos(angle) * stick.reach), Math.round(stick.baseY + Math.sin(angle) * stick.reach), 1, 1);
  }
  const knobX = Math.round(stick.knobX) - KNOB_HALF;
  const knobY = Math.round(stick.knobY) - KNOB_HALF;
  ctx.fillRect(knobX, knobY + 1, KNOB_HALF * 2, KNOB_HALF * 2 - 2);
  ctx.fillRect(knobX + 1, knobY, KNOB_HALF * 2 - 2, KNOB_HALF * 2);
  ctx.globalAlpha = 1;
}
