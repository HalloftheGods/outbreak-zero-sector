/** Marker pen for the magazine's photos: paths that wobble the same way every time, in the photo's own pixels. */

const CIRCLE_STEPS = 32;
/** A hand goes past where it started, so the ring overlaps itself. */
const CIRCLE_SWEEP = 1.12;
const WOBBLE = 0.07;
const ARROW_BEND = 0.14;
const HEAD_ANGLE = 0.5;
const HEAD_MIN = 5;

const round = (value: number) => Math.round(value * 10) / 10;

/** Steady for a given step, so a page reprints the same. */
const wobble = (step: number) => Math.sin(step * 0.7) * WOBBLE + Math.sin(step * 1.9) * WOBBLE * 0.4;

export function handCirclePath(x: number, y: number, r: number): string {
  const points: string[] = [];
  for (let step = 0; step <= CIRCLE_STEPS; step += 1) {
    const angle = -1.9 + (step / CIRCLE_STEPS) * Math.PI * 2 * CIRCLE_SWEEP;
    const reach = r * (1 + wobble(step));
    points.push(`${round(x + Math.cos(angle) * reach)} ${round(y + Math.sin(angle) * reach * 0.86)}`);
  }
  return `M${points.join(' L')}`;
}

/** A bowed line, then the two strokes of the head. */
export function handArrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const bendX = (x1 + x2) / 2 - dy * ARROW_BEND;
  const bendY = (y1 + y2) / 2 + dx * ARROW_BEND;
  const heading = Math.atan2(y2 - bendY, x2 - bendX);
  const head = Math.max(HEAD_MIN, length * 0.16);
  const barb = (side: number) => {
    const angle = heading + Math.PI + side * HEAD_ANGLE;
    return `M${round(x2 + Math.cos(angle) * head)} ${round(y2 + Math.sin(angle) * head)} L${round(x2)} ${round(y2)}`;
  };
  return `M${round(x1)} ${round(y1)} Q${round(bendX)} ${round(bendY)} ${round(x2)} ${round(y2)} ${barb(1)} ${barb(-1)}`;
}
