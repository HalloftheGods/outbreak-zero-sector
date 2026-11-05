import { titleUnit, uiUnit, viewReachCap } from '../engine/viewport.ts';
import type { WorldRenderer } from '../engine/world-renderer.ts';

/** Sizes the overlay and the canvas to the window, as it stands and for the mode being played. */
export function fitWindow(renderer: WorldRenderer | null, coop: boolean, touch: boolean): void {
  const { innerWidth: width, innerHeight: height } = window;
  document.documentElement.style.setProperty('--u', `${uiUnit(width, height)}px`);
  document.documentElement.style.setProperty('--title-u', `${titleUnit(width, height)}px`);
  renderer?.resize(viewReachCap(coop, touch, width, height));
}
