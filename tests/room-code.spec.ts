import { describe, expect, it } from 'vitest';
import {
  generateRoomCode,
  isBlockedRoomCode,
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from '../shared/lobby/room-code.ts';

describe('generateRoomCode', () => {
  it('uses only the 16 safe letters at the default length', () => {
    expect(ROOM_CODE_ALPHABET).toHaveLength(16);
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      expect(code).toMatch(/^[BCDFGHJKMNPRTVWX]+$/);
      expect(isBlockedRoomCode(code)).toBe(false);
    }
  });

  it('honours a custom length and varies', () => {
    expect(generateRoomCode(7)).toHaveLength(7);
    expect(new Set(Array.from({ length: 50 }, () => generateRoomCode())).size).toBeGreaterThan(40);
  });
});

describe('normalizeRoomCode', () => {
  it('uppercases and trims', () => {
    expect(normalizeRoomCode('  bcdfg ')).toEqual({ ok: true, code: 'BCDFG' });
  });

  it('says letters only for digits and I/L/O', () => {
    for (const bad of ['BCDF1', 'BCDFI', 'bcdfl', 'BCDFO', 'BC DF', 'BCD-F']) {
      const check = normalizeRoomCode(bad);
      expect(check.ok, bad).toBe(false);
      expect(check.ok ? '' : check.reason).toContain('letters only');
    }
  });

  it('refuses wrong length, other letters, blocked runs and non-strings', () => {
    for (const bad of ['BCDF', 'BCDFGH', 'ABCDF', 'BFCKD', 'WTFBD', '', '   ', null, undefined, 5]) {
      expect(normalizeRoomCode(bad).ok, String(bad)).toBe(false);
    }
  });
});
