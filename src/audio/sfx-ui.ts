import { noise, tone, type Recipe } from './voice-kit.ts';

export const uiClick: Recipe = (v) => {
  tone(v, { type: 'square', f0: 1400, f1: 900, decay: 0.03, gain: 0.2, lp: 4000 });
  noise(v, { filter: 'bandpass', freq: 3000, q: 2, decay: 0.012, gain: 0.15 });
};

export const uiHover: Recipe = (v) => {
  tone(v, { type: 'sine', f0: 1200, decay: 0.025, gain: 0.1 });
};

export const uiStart: Recipe = (v) => {
  noise(v, { filter: 'bandpass', freq: 400, freq1: 3000, q: 1, attack: 0.15, decay: 0.15, gain: 0.2 });
  tone(v, { type: 'square', f0: 220, f1: 440, decay: 0.25, gain: 0.18, lp: 2500 });
  tone(v, { at: 0.2, type: 'square', f0: 440, f1: 660, decay: 0.2, gain: 0.15, lp: 2500 });
};

export const uiPause: Recipe = (v) => {
  tone(v, { type: 'triangle', f0: 660, decay: 0.08, gain: 0.25 });
  tone(v, { at: 0.09, type: 'triangle', f0: 440, decay: 0.14, gain: 0.25 });
};

export const uiResume: Recipe = (v) => {
  tone(v, { type: 'triangle', f0: 440, decay: 0.08, gain: 0.25 });
  tone(v, { at: 0.09, type: 'triangle', f0: 660, decay: 0.14, gain: 0.25 });
};
