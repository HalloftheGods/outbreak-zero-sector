export interface TouchButton {
  readonly label: string;
  /** The key this button stands in for. */
  readonly code: string;
}

/** Top to bottom on a wide screen and left to right on a tall one, so the busiest sit under the right thumb. */
export const TOUCH_BUTTONS: readonly TouchButton[] = [
  { label: 'Pause', code: 'Escape' },
  { label: 'Map', code: 'KeyN' },
  { label: 'Weapon', code: 'KeyQ' },
  { label: 'Heal', code: 'KeyH' },
  { label: 'Search', code: 'KeyE' },
  { label: 'Reload', code: 'KeyR' },
  { label: 'Shove', code: 'KeyF' },
];
