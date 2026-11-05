import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type { ClientInputPacket, WeaponId } from '../../shared/protocol.ts';

const WHEEL_COOLDOWN_MS = 110;

const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const MOVE_CODES = [...UP, ...DOWN, ...LEFT, ...RIGHT];

const WEAPON_KEYS: Readonly<Record<string, WeaponId>> = {
  Digit1: 'pistol',
  Digit2: 'carbine',
  Digit3: 'shotgun',
};

const SHOVE_CODE = 'KeyF';
const HEAL_CODE = 'KeyH';
const MAP_CODES: ReadonlySet<string> = new Set(['Tab', 'KeyN']);
const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;
const LEFT_BUTTON_BIT = 1;
const RIGHT_BUTTON_BIT = 2;

const GAME_CODES: ReadonlySet<string> = new Set([
  ...MOVE_CODES,
  'KeyR',
  'KeyQ',
  'Space',
  SHOVE_CODE,
  HEAL_CODE,
  ...Object.keys(WEAPON_KEYS),
]);

export interface InputCallbacks {
  /** First key or click, the moment browsers allow audio to start. */
  onGesture(): void;
  onPause(): void;
  onMute(): void;
  /** Enter, and what had focus, since the title answers it differently in the server field. */
  onConfirm(target: EventTarget | null): void;
  /** Tab or N. True if the game took the key, so Tab does not also move focus. */
  onMap(): boolean;
  /** The map is open or could open, so a Tab held down must stay away from the browser. */
  mapUsable(): boolean;
}

interface OwnedWeapons {
  readonly owned: readonly WeaponId[];
  readonly weapon: WeaponId;
}

/** The next weapon the player owns, stepping through WEAPON_ORDER and wrapping. */
export function cycleWeapon(state: OwnedWeapons, step: number): WeaponId | null {
  const owned = WEAPON_ORDER.filter((weapon) => state.owned.includes(weapon));
  if (owned.length < 2 || step === 0) return null;
  const current = Math.max(0, owned.indexOf(state.weapon));
  return owned[(current + step + owned.length * 8) % owned.length];
}

/** A slider is an input too, but nothing is typed into it. */
function isTyping(target: EventTarget | null): boolean {
  const isSlider = target instanceof HTMLInputElement && target.type === 'range';
  if (isSlider) return false;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

/** With Ctrl, Cmd or Alt down a key is the browser's shortcut, not the game's. */
function isShortcut(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

/**
 * Keyboard and mouse. One-shot requests latch until sampled. Held state follows
 * the player's hands even while a menu is up, and only counts while enabled, so
 * a key held through a menu takes effect again the moment it closes.
 */
export class InputManager {
  pointerClientX = 0;
  pointerClientY = 0;

  private readonly callbacks: InputCallbacks;
  private readonly held = new Set<string>();
  private enabled = false;
  private firing = false;
  private shoving = false;
  private fireLatch = false;
  private shoveLatch = false;
  private healLatch = false;
  private reloadLatch = false;
  private weaponLatch: WeaponId | null = null;
  private cycleLatch = 0;
  private lastWheelAt = 0;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.pointerClientX = window.innerWidth / 2;
    this.pointerClientY = window.innerHeight / 2;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('blur', this.clearHeld);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('blur', this.clearHeld);
  }

  /** Off while any menu is up; nothing typed or clicked there reaches the game. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.clearLatches();
  }

  /** Lets go of everything, as if the player had taken their hands off. */
  readonly clearHeld = (): void => {
    this.held.clear();
    this.firing = false;
    this.shoving = false;
    this.clearLatches();
  };

  private clearLatches(): void {
    this.fireLatch = false;
    this.shoveLatch = false;
    this.healLatch = false;
    this.reloadLatch = false;
    this.weaponLatch = null;
    this.cycleLatch = 0;
  }

  private isHeld(codes: readonly string[]): boolean {
    return this.enabled && codes.some((code) => this.held.has(code));
  }

  get dirX(): number {
    return Number(this.isHeld(RIGHT)) - Number(this.isHeld(LEFT));
  }

  get dirY(): number {
    return Number(this.isHeld(DOWN)) - Number(this.isHeld(UP));
  }

  /** Builds the packet for this tick and spends the latches. */
  sample(seq: number, angle: number, weapons: OwnedWeapons | null): ClientInputPacket {
    const cycled = weapons ? cycleWeapon(weapons, this.cycleLatch) : null;
    const packet: ClientInputPacket = {
      seq,
      up: this.isHeld(UP),
      down: this.isHeld(DOWN),
      left: this.isHeld(LEFT),
      right: this.isHeld(RIGHT),
      angle,
      shoot: this.fireLatch || (this.enabled && this.firing),
      reload: this.reloadLatch,
      weapon: this.weaponLatch ?? cycled,
      melee: this.shoveLatch || (this.enabled && this.shoving) || this.isHeld([SHOVE_CODE]),
      heal: this.healLatch,
    };
    this.clearLatches();
    return packet;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (isShortcut(event)) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) this.callbacks.onPause();
      return;
    }
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      // A focused button already answers Enter with a click.
      if (!event.repeat && !(event.target instanceof HTMLButtonElement)) this.callbacks.onConfirm(event.target);
      return;
    }
    if (isTyping(event.target)) return;
    this.callbacks.onGesture();
    if (event.code === 'KeyM') {
      if (!event.repeat) this.callbacks.onMute();
      return;
    }
    if (MAP_CODES.has(event.code)) {
      const taken = event.repeat ? this.callbacks.mapUsable() : this.callbacks.onMap();
      if (taken) event.preventDefault();
      return;
    }
    if (!GAME_CODES.has(event.code)) return;
    this.held.add(event.code);
    if (!this.enabled) return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'KeyR') this.reloadLatch = true;
    if (event.code === 'KeyQ') this.cycleLatch += 1;
    this.shoveLatch ||= event.code === SHOVE_CODE;
    this.healLatch ||= event.code === HEAL_CODE;
    const weapon = WEAPON_KEYS[event.code];
    if (weapon) this.weaponLatch = weapon;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    this.pointerClientX = event.clientX;
    this.pointerClientY = event.clientY;
    // A native drag or menu can swallow the release; this is the first honest word on the buttons.
    this.firing &&= (event.buttons & LEFT_BUTTON_BIT) !== 0;
    this.shoving &&= (event.buttons & RIGHT_BUTTON_BIT) !== 0;
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    this.callbacks.onGesture();
    this.pointerClientX = event.clientX;
    this.pointerClientY = event.clientY;
    const pressedLeft = event.button === LEFT_BUTTON;
    const pressedRight = event.button === RIGHT_BUTTON;
    // A press on a menu belongs to the menu, which may never hand back its release.
    if (!this.enabled) return;
    this.firing ||= pressedLeft;
    this.shoving ||= pressedRight;
    this.fireLatch ||= pressedLeft;
    this.shoveLatch ||= pressedRight;
  };

  private readonly onMouseUp = (event: MouseEvent): void => {
    this.firing &&= event.button !== LEFT_BUTTON;
    this.shoving &&= event.button !== RIGHT_BUTTON;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    const now = performance.now();
    if (now - this.lastWheelAt < WHEEL_COOLDOWN_MS || event.deltaY === 0) return;
    this.lastWheelAt = now;
    this.cycleLatch += Math.sign(event.deltaY);
  };

  /** Menus included: a right-click shove can land just after input turns off. */
  private readonly onContextMenu = (event: MouseEvent): void => {
    if (!isTyping(event.target)) event.preventDefault();
    // The native menu takes every release from here, with no blur to say so.
    else this.clearHeld();
  };
}
