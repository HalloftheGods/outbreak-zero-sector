import { describe, expect, it } from 'vitest';
import {
  CLOSE,
  CLOSE_CODES,
  closeText,
  FRIEND_NEEDS_UPDATE_TEXT,
  NEEDS_UPDATE_TEXT,
  UPDATE_REASON,
} from '../shared/close-codes.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import { parseClientPacket } from '../shared/room/client-packets.ts';
import { JOIN_TIMEOUT_CODE, MESSAGE_TOO_BIG_CODE, ROOM_FULL_CODE, SERVER_BUSY_CODE } from '../shared/room/limits.ts';

describe('close codes', () => {
  it('keeps the numbers the spec and the old server already use', () => {
    expect(CLOSE).toMatchObject({
      roomFull: 4000, serverBusy: 4001, noJoin: 4002, notFound: 4010, hostLeft: 4011, removed: 4012,
      locked: 4013, needsUpdate: 4014, rateLimited: 4015, hostAway: 4016, roomIdle: 4017, tooBig: 1009,
    });
    expect([ROOM_FULL_CODE, SERVER_BUSY_CODE, JOIN_TIMEOUT_CODE, MESSAGE_TOO_BIG_CODE]).toEqual([4000, 4001, 4002, 1009]);
  });

  it('uses each number once', () => {
    expect(new Set(CLOSE_CODES).size).toBe(CLOSE_CODES.length);
  });

  it.each(CLOSE_CODES.map((code) => [code]))('tells the player what %i means', (code) => {
    const text = closeText(code);
    expect(text).toBeTruthy();
    expect(text).not.toMatch(/\d{4}/);
  });

  it('knows nothing of a code outside the table', () => {
    expect(closeText(1006)).toBeNull();
    expect(closeText(4003)).toBeNull();
  });

  it('words 4014 for the side that is behind', () => {
    expect(closeText(CLOSE.needsUpdate, UPDATE_REASON.guestOlder)).toBe(NEEDS_UPDATE_TEXT);
    expect(closeText(CLOSE.needsUpdate, UPDATE_REASON.hostOlder)).toBe(FRIEND_NEEDS_UPDATE_TEXT);
    expect(NEEDS_UPDATE_TEXT).toBe('This game needs an update: reload');
    expect(FRIEND_NEEDS_UPDATE_TEXT).toBe('Your friend needs to update their game');
  });

  it('reads this side as the one to reload when the reason is missing', () => {
    expect(closeText(CLOSE.needsUpdate)).toBe(NEEDS_UPDATE_TEXT);
  });
});

describe('join protocol', () => {
  const join = (extra: Record<string, unknown>) => parseClientPacket(JSON.stringify({ type: 'join', name: 'a', token: 't', ...extra }));

  it('carries the protocol a client names', () => {
    expect(join({ protocol: PROTOCOL_VERSION })).toMatchObject({ type: 'join', protocol: PROTOCOL_VERSION });
  });

  it('leaves it off for an older client', () => {
    expect(join({})).not.toHaveProperty('protocol');
  });

  it.each([['text', '1'], ['a fraction', 1.5], ['negative', -1], ['null', null]])('rejects a protocol that is %s', (_name, protocol) => {
    expect(join({ protocol })).toBeNull();
  });
});
