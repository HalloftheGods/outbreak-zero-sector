import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { SnapshotPacket } from '../shared/protocol.ts';
import { EMOTE_BURST, EMOTE_GAP_SEC, EMOTE_IDS, freshEmoteBudget, isEmoteId, takeEmote } from '../shared/emotes.ts';
import { parseClientPacket } from '../shared/room/client-packets.ts';
import { TICK_RATE } from '../shared/constants.ts';
import { buildEmoteIcons } from '../src/art/fx/emotes.ts';
import { isSnapshotPacket } from '../src/network/packet-guards.ts';
import { eventsOf, quietSim, steps } from './helpers/sim-harness.ts';

const emoteEvents = (snapshot: SnapshotPacket) => eventsOf(snapshot, 'emote');

describe('the six emotes', () => {
  it('are exactly help, go, thanks, wait, danger and nice', () => {
    expect([...EMOTE_IDS].sort()).toEqual(['danger', 'go', 'help', 'nice', 'thanks', 'wait']);
    expect(isEmoteId('help')).toBe(true);
    expect(isEmoteId('hello')).toBe(false);
    expect(isEmoteId(3)).toBe(false);
  });

  it('are drawn as one 16 by 16 icon each', () => {
    const icons = buildEmoteIcons();
    for (const id of EMOTE_IDS) {
      expect(icons[id].w).toBe(16);
      expect(icons[id].h).toBe(16);
      expect(icons[id].rgba.some((_, i) => i % 4 === 3 && icons[id].rgba[i] === 255)).toBe(true);
    }
  });

  it('bump the protocol past the muster-free first version', () => {
    expect(PROTOCOL_VERSION).toBeGreaterThanOrEqual(2);
  });
});

describe('the emote packet', () => {
  it('parses a known emote and drops everything else', () => {
    expect(parseClientPacket(JSON.stringify({ type: 'emote', emote: 'danger' }))).toEqual({ type: 'emote', emote: 'danger' });
    expect(parseClientPacket(JSON.stringify({ type: 'emote', emote: 'free text' }))).toBeNull();
    expect(parseClientPacket(JSON.stringify({ type: 'emote' }))).toBeNull();
    expect(parseClientPacket(JSON.stringify({ type: 'emote', emote: { toString: 'help' } }))).toBeNull();
  });

  it('reaches the client guards as a snapshot event they accept', () => {
    const { sim } = quietSim(['a']);
    sim.emote('a', 'go');
    const snapshot = sim.snapshot();
    expect(emoteEvents(snapshot)).toEqual([{ type: 'emote', playerId: 'a', emote: 'go' }]);
    expect(isSnapshotPacket(JSON.parse(JSON.stringify(snapshot)))).toBe(true);
  });
});

describe('the emote pace', () => {
  it('lets a burst of three through and drops the fourth', () => {
    const { sim } = quietSim(['a']);
    for (let i = 0; i < EMOTE_BURST + 2; i += 1) sim.emote('a', 'help');
    expect(emoteEvents(sim.snapshot())).toHaveLength(EMOTE_BURST);
  });

  it('gives one back every 1.5 seconds', () => {
    const { sim } = quietSim(['a']);
    for (let i = 0; i < EMOTE_BURST; i += 1) sim.emote('a', 'help');
    sim.snapshot();
    steps(sim, Math.ceil(EMOTE_GAP_SEC * TICK_RATE) + 1);
    sim.emote('a', 'nice');
    sim.emote('a', 'nice');
    expect(emoteEvents(sim.snapshot())).toEqual([{ type: 'emote', playerId: 'a', emote: 'nice' }]);
  });

  it('keeps each player to their own allowance', () => {
    const { sim } = quietSim(['a', 'b']);
    for (let i = 0; i < 5; i += 1) sim.emote('a', 'help');
    sim.emote('b', 'wait');
    const from = emoteEvents(sim.snapshot()).map((event) => event.playerId);
    expect(from.filter((id) => id === 'b')).toHaveLength(1);
  });

  it('drops an unknown id or an unknown player without a trace', () => {
    const { sim } = quietSim(['a']);
    sim.emote('a', 'hello world');
    sim.emote('a', undefined);
    sim.emote('nobody', 'help');
    expect(emoteEvents(sim.snapshot())).toEqual([]);
    sim.step();
  });

  it('refills by time alone in the bucket', () => {
    const budget = freshEmoteBudget();
    const results = [0, 0, 0, 0, 1.5].map((now) => takeEmote(budget, now));
    expect(results).toEqual([true, true, true, false, true]);
  });
});
