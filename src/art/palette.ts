// The master palette: 64 colours in hue-shifted ramps, each ordered dark to light.
// Shadows lean blue or purple and highlights lean warm, so a ramp never reads as
// a plain tint of one hue. Every sprite draws only from these colours.

export type Color = number;
export type Ramp = readonly Color[];

export const RAMPS = {
  /** Outlines and voids. */
  ink: [0x0d0b16, 0x1b1728],
  skin: [0x5c2f42, 0xa05a4a, 0xdc9868, 0xfad0a4],
  skinDeep: [0x3a2030, 0x74443a, 0xaa7650],
  /** Undead flesh, green. */
  rot: [0x24343e, 0x3c5e4a, 0x6f9154, 0xb4c47a],
  /** Undead flesh, grey. Also faded cloth. */
  ash: [0x3a384e, 0x6c6a78, 0xa8a492],
  blood: [0x3a0f2a, 0x761830, 0xb82a30, 0xe85c40],
  bone: [0x6e6272, 0xa89a80, 0xdccca0, 0xfaf2d4],
  denim: [0x222c52, 0x3a5288, 0x6488bc],
  teal: [0x143e4a, 0x1f8080, 0x58d0a8],
  violet: [0x34205c, 0x6c3c9c, 0xb070d0],
  olive: [0x30362a, 0x565c36, 0x8c8c56],
  /** Wood, leather and boots. */
  wood: [0x2c1c28, 0x4e3432, 0x7c5840, 0xac8458],
  metal: [0x242840, 0x484e68, 0x7c8494, 0xc0c6c8],
  /** The road. Darkest of the environment ramps on purpose. */
  asphalt: [0x15171f, 0x1c1f29, 0x262933],
  concrete: [0x30313d, 0x44444f, 0x5e5d64, 0x7e7c7a],
  brick: [0x321c28, 0x522a30, 0x784038],
  grass: [0x15231f, 0x213629, 0x365030],
  /** Fire, muzzle flash, lamps. Also the amber cloth accent. */
  fire: [0xa03018, 0xe8701c, 0xffc03c, 0xfff0b4],
  acid: [0x246030, 0x5ca82c, 0xc4f048],
} as const satisfies Record<string, Ramp>;

export type RampName = keyof typeof RAMPS;

export const INK: Color = RAMPS.ink[0];
export const INK_SOFT: Color = RAMPS.ink[1];

/** Colours a sprite may use that are not in a ramp. Keep this empty if at all possible. */
export const PALETTE_EXCEPTIONS: readonly Color[] = [];

export const ALL_COLORS: readonly Color[] = Object.values(RAMPS).flat();
const allowed = new Set<Color>([...ALL_COLORS, ...PALETTE_EXCEPTIONS]);

export function inPalette(color: Color): boolean {
  return allowed.has(color);
}

const rampOf = new Map<Color, Ramp>();
for (const ramp of Object.values(RAMPS)) for (const color of ramp) rampOf.set(color, ramp);

/** Moves a colour along its own ramp, clamped at the ends. Positive is lighter. */
export function shift(color: Color, steps: number): Color {
  const ramp = rampOf.get(color);
  if (!ramp) return color;
  const index = ramp.indexOf(color) + steps;
  return ramp[Math.max(0, Math.min(ramp.length - 1, index))];
}

export function darker(color: Color, steps = 1): Color {
  return shift(color, -steps);
}

export function lighter(color: Color, steps = 1): Color {
  return shift(color, steps);
}

export function toHex(color: Color): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
