import { JOIN_TOKEN_MAX_LENGTH } from '../shared/constants.ts';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { ClientInputPacket, ClientPacket, WeaponId } from '../shared/protocol.ts';

const NAME_MAX_LENGTH = 16;
const DEFAULT_NAME = 'Survivor';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isWeaponRequest = (value: unknown): value is WeaponId | null =>
  value === null || WEAPON_ORDER.includes(value as WeaponId);

const isJoinToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= JOIN_TOKEN_MAX_LENGTH;

function parseInput(value: unknown): ClientInputPacket | null {
  if (!isRecord(value)) return null;
  const { seq, up, down, left, right, angle, shoot, reload, weapon, melee, heal } = value;
  const numbersValid = typeof seq === 'number' && Number.isFinite(seq) && seq >= 0 && typeof angle === 'number' && Number.isFinite(angle);
  const flags = [up, down, left, right, shoot, reload, melee, heal];
  if (!numbersValid || !flags.every((flag) => typeof flag === 'boolean') || !isWeaponRequest(weapon)) return null;
  return {
    seq,
    angle,
    weapon,
    up: up as boolean,
    down: down as boolean,
    left: left as boolean,
    right: right as boolean,
    shoot: shoot as boolean,
    reload: reload as boolean,
    melee: melee as boolean,
    heal: heal as boolean,
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
    const { name, token } = value;
    return typeof name === 'string' && isJoinToken(token) ? { type: 'join', name: sanitiseName(name), token } : null;
  }
  if (value.type === 'input') {
    const input = parseInput(value.input);
    return input ? { type: 'input', input } : null;
  }
  return value.type === 'restart' ? { type: 'restart' } : null;
}
