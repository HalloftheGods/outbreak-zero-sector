import { isCharacterIndex } from '../shared/characters.ts';
import { JOIN_TOKEN_MAX_LENGTH } from '../shared/constants.ts';
import { isDifficultyId } from '../shared/difficulty.ts';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { ClientInputPacket, ClientPacket, WeaponId } from '../shared/protocol.ts';
import { isBenchAction } from '../shared/workbench.ts';

const NAME_MAX_LENGTH = 16;
const DEFAULT_NAME = 'Survivor';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isWeaponRequest = (value: unknown): value is WeaponId | null =>
  value === null || WEAPON_ORDER.includes(value as WeaponId);

const isJoinToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= JOIN_TOKEN_MAX_LENGTH;

const isCoordinate = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Both or neither: an input with no crosshair is fine, half of one is not a real client. */
function parseAim(aimX: unknown, aimY: unknown): { aimX?: number; aimY?: number } | null {
  if (aimX === undefined && aimY === undefined) return {};
  return isCoordinate(aimX) && isCoordinate(aimY) ? { aimX, aimY } : null;
}

function parseInput(value: unknown): ClientInputPacket | null {
  if (!isRecord(value)) return null;
  const { seq, up, down, left, right, angle, aimX, aimY, shoot, reload, weapon, melee, heal, search } = value;
  const numbersValid = typeof seq === 'number' && Number.isFinite(seq) && seq >= 0 && typeof angle === 'number' && Number.isFinite(angle);
  const flags = [up, down, left, right, shoot, reload, melee, heal, search];
  const aim = parseAim(aimX, aimY);
  if (!numbersValid || !aim || !flags.every((flag) => typeof flag === 'boolean') || !isWeaponRequest(weapon)) return null;
  return {
    seq,
    angle,
    ...aim,
    weapon,
    up: up as boolean,
    down: down as boolean,
    left: left as boolean,
    right: right as boolean,
    shoot: shoot as boolean,
    reload: reload as boolean,
    melee: melee as boolean,
    heal: heal as boolean,
    search: search as boolean,
  };
}

/** Strips control characters and collapses whitespace, falling back to a generic label. */
export function sanitiseName(value: string): string {
  const cleaned = value.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim();
  return [...cleaned].slice(0, NAME_MAX_LENGTH).join('').trim() || DEFAULT_NAME;
}

/** Null for anything that is not exactly a valid client packet. */
export function parseClientPacket(raw: string): ClientPacket | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;

  if (value.type === 'join') {
    const { name, token, character, difficulty } = value;
    const validCharacter = character === undefined || isCharacterIndex(character);
    const valid = typeof name === 'string' && isJoinToken(token) && validCharacter;
    // An older client sends none, and an unknown one is not worth turning a player away for.
    const chosen = isDifficultyId(difficulty) ? { difficulty } : {};
    return valid ? { type: 'join', name: sanitiseName(name), token, character, ...chosen } : null;
  }
  if (value.type === 'input') {
    const input = parseInput(value.input);
    return input ? { type: 'input', input } : null;
  }
  if (value.type === 'bench') return isBenchAction(value.action) ? { type: 'bench', action: value.action } : null;
  return value.type === 'restart' ? { type: 'restart' } : null;
}
