import { describe, expect, it } from 'vitest';
import {
  HIDE_AFTER_MS,
  HOST_RECONNECT_GRACE_MS,
  hostGraceExpired,
  isStale,
  isTombstoned,
  listingFate,
  ROOM_MAX_AGE_MS,
  roomTooOld,
  SWEEP_AFTER_MS,
  TOMBSTONE_MS,
} from '../shared/lobby/ttl.ts';

describe('lobby ttl', () => {
  it('uses the spec numbers', () => {
    expect(HIDE_AFTER_MS).toBe(90_000);
    expect(SWEEP_AFTER_MS).toBe(180_000);
    expect(HOST_RECONNECT_GRACE_MS).toBe(120_000);
    expect(TOMBSTONE_MS).toBe(900_000);
    expect(ROOM_MAX_AGE_MS).toBe(43_200_000);
  });

  it('hides at 90 s unseen and sweeps at 180 s', () => {
    expect(listingFate(0, HIDE_AFTER_MS - 1)).toBe('live');
    expect(listingFate(0, HIDE_AFTER_MS)).toBe('hidden');
    expect(listingFate(0, SWEEP_AFTER_MS - 1)).toBe('hidden');
    expect(listingFate(0, SWEEP_AFTER_MS)).toBe('sweep');
    expect(isStale(0, HIDE_AFTER_MS - 1)).toBe(false);
    expect(isStale(0, HIDE_AFTER_MS)).toBe(true);
  });

  it('gives a dropped host two minutes', () => {
    expect(hostGraceExpired(1000, 1000 + HOST_RECONNECT_GRACE_MS - 1)).toBe(false);
    expect(hostGraceExpired(1000, 1000 + HOST_RECONNECT_GRACE_MS)).toBe(true);
  });

  it('refuses an ended code for 15 minutes', () => {
    expect(isTombstoned(0, TOMBSTONE_MS - 1)).toBe(true);
    expect(isTombstoned(0, TOMBSTONE_MS)).toBe(false);
  });

  it('ends every room at 12 hours', () => {
    expect(roomTooOld(0, ROOM_MAX_AGE_MS - 1)).toBe(false);
    expect(roomTooOld(0, ROOM_MAX_AGE_MS)).toBe(true);
  });
});
