import { describe, expect, it } from 'vitest';
import { allowedParams } from '../src/game/analytics/catalog.ts';
import { RunTracker } from '../src/game/analytics/run-tracker.ts';
import type { Profile, TrackedUi } from '../src/game/analytics/run-tracker.ts';
import type { HudState } from '../src/game/hud-state.ts';

const PROFILE: Profile = { difficulty: 'lights_out', survivor: 'night', input: 'mouse', orientation: 'landscape' };

function hud(overrides: Partial<HudState> = {}): HudState {
  const none = { pistol: 0, shotgun: 0, rifle: 0 } as unknown as HudState['mags'];
  return {
    owned: ['pistol'],
    mags: { ...none, pistol: 5 },
    ammoBag: { ...none, pistol: 7 },
    level: 2,
    score: 0,
    bench: null,
    ...overrides,
  } as unknown as HudState;
}

function ui(screen: TrackedUi['screen'], state: Partial<TrackedUi> = {}): TrackedUi {
  return { screen, mode: 'solo', hud: null, ...state };
}

function setup() {
  let clock = 0;
  const sent: { name: string; params: Record<string, unknown> }[] = [];
  const tracker = new RunTracker({
    emit: (name, params) => void sent.push({ name, params: { ...params } }),
    now: () => clock,
    profile: () => PROFILE,
  });
  return {
    tracker,
    sent,
    advance: (ms: number) => void (clock += ms),
    names: () => sent.map((each) => each.name),
    last: (name: string) => sent.filter((each) => each.name === name).at(-1)?.params,
  };
}

describe('analytics run tracker', () => {
  it('counts a title view when the title shows', () => {
    const { tracker, names } = setup();
    tracker.ui(ui('title'));
    tracker.ui(ui('title'));
    expect(names()).toEqual(['title_view']);
  });

  it('maps title pages and ignores the rest', () => {
    const { tracker, names } = setup();
    for (const page of ['play', 'howto', 'sound', 'options', 'records']) tracker.titlePage(page);
    expect(names()).toEqual(['play_setup_open', 'how_to_play_open', 'sound_test_open']);
  });

  it('sums a level into one event, not one per shot', () => {
    const { tracker, sent, advance, last } = setup();
    tracker.localPlayer('p1');
    tracker.ui(ui('title'));
    tracker.ui(ui('game'));
    tracker.event({ type: 'level_start', level: 2 });
    tracker.ui(ui('game', { hud: hud() }));
    advance(30000);
    for (let shot = 0; shot < 40; shot++) tracker.event({ type: 'shot', playerId: 'p1', weapon: 'pistol', x: 0, y: 0, angle: 0 });
    tracker.event({ type: 'shot', playerId: 'someone-else', weapon: 'pistol', x: 0, y: 0, angle: 0 });
    tracker.event({ type: 'dry_fire', playerId: 'p1', x: 0, y: 0 });
    tracker.event({ type: 'player_downed', playerId: 'p1', x: 0, y: 0 });
    tracker.event({ type: 'level_complete', level: 2 });
    expect(sent.filter((each) => each.name === 'level_complete')).toHaveLength(1);
    expect(last('level_complete')).toEqual({
      level: 2,
      seconds: 30,
      downs: 1,
      ammo_left: 12,
      shots_fired: 40,
      dry_fires: 1,
      difficulty: 'lights_out',
      survivor: 'night',
    });
  });

  it('starts a run once, with the setup and no coop event when solo', () => {
    const { tracker, names, last } = setup();
    tracker.ui(ui('game', { hud: hud({ level: 3 }) }));
    tracker.ui(ui('game', { hud: hud({ level: 3 }) }));
    expect(names()).toEqual(['run_start']);
    expect(last('run_start')).toEqual({ ...PROFILE, mode: 'solo', start_level: 3 });
  });

  it('reports a co-op join', () => {
    const { tracker, names } = setup();
    tracker.ui(ui('game', { mode: 'coop', hud: hud() }));
    expect(names()).toEqual(['run_start', 'coop_join']);
  });

  it('ends a run with banded results and the survivor who played', () => {
    const { tracker, last, names } = setup();
    tracker.localPlayer('p1');
    tracker.ui(ui('game', { hud: hud() }));
    tracker.event({
      type: 'game_over',
      stats: {
        outcome: 'victory',
        difficulty: 'undead_tired',
        level: 10,
        wave: 30,
        durationSec: 3600.4,
        players: [
          { id: 'p1', name: 'ZEDKILLER', skin: 3, kills: 99, score: 12345 },
          { id: 'p2', name: 'FRIEND', skin: 1, kills: 1, score: 5 },
        ],
      },
    });
    expect(last('run_end')).toEqual({
      result: 'victory',
      level_reached: 10,
      seconds: 3600.4,
      score_band: '10000-24999',
      difficulty: 'undead_tired',
      survivor: 'rex',
    });
    tracker.event({ type: 'game_over', stats: { outcome: 'defeat', difficulty: 'lights_out', level: 1, wave: 1, durationSec: 1, players: [] } });
    expect(names().filter((each) => each === 'run_end')).toHaveLength(1);
  });

  it('never lets a callsign into anything it emits', () => {
    const { tracker, sent } = setup();
    tracker.localPlayer('p1');
    tracker.ui(ui('game', { hud: hud() }));
    tracker.event({
      type: 'game_over',
      stats: { outcome: 'defeat', difficulty: 'lights_out', level: 2, wave: 3, durationSec: 90, players: [{ id: 'p1', name: 'ZEDKILLER', skin: 0, kills: 1, score: 10 }] },
    });
    expect(JSON.stringify(sent)).not.toContain('ZEDKILLER');
    for (const each of sent) {
      const allowed = allowedParams(each.name, each.params);
      expect(allowed).toEqual(each.params.seconds === undefined ? each.params : { ...each.params, seconds: Math.round(each.params.seconds as number) });
    }
  });

  it('calls leaving a run mid-way a quit, and losing the connection a disconnect', () => {
    const quit = setup();
    quit.tracker.ui(ui('game', { hud: hud() }));
    quit.tracker.ui(ui('title'));
    expect(quit.last('run_end')?.result).toBe('quit');
    const lost = setup();
    lost.tracker.ui(ui('game', { hud: hud() }));
    lost.tracker.ui(ui('lost'));
    expect(lost.last('run_end')?.result).toBe('disconnected');
  });

  it('sends one frame-rate summary per run, from counted frames only', () => {
    const { tracker, names, last } = setup();
    tracker.ui(ui('game', { hud: hud() }));
    for (let frame = 0; frame <= 120; frame++) tracker.frame(frame * 16.7);
    tracker.frame(120 * 16.7 + 60000);
    tracker.ui(ui('title'));
    expect(names().filter((each) => each === 'perf_summary')).toHaveLength(1);
    expect(last('perf_summary')).toEqual({ fps_band: '45-60', device_class: 'desktop' });
  });

  it('reports the workbench once per visit and a fitted gun effect', () => {
    const { tracker, names, last } = setup();
    tracker.ui(ui('game', { hud: hud() }));
    const open = hud({ bench: {} as HudState['bench'] });
    tracker.ui(ui('game', { hud: open }));
    tracker.ui(ui('game', { hud: open }));
    tracker.ui(ui('game', { hud: hud() }));
    tracker.bench({ kind: 'fit_effect', weapon: 'pistol', effect: 'acid' });
    tracker.bench({ kind: 'ready', ready: true });
    expect(names()).toEqual(['run_start', 'workbench_use', 'gun_effect_fit']);
    expect(last('gun_effect_fit')).toEqual({ effect: 'acid' });
  });

  it('does not start a phantom run while the game screen lingers after game over', () => {
    const { tracker, names } = setup();
    tracker.localPlayer('p1');
    tracker.ui(ui('game', { hud: hud() }));
    tracker.event({ type: 'game_over', stats: { outcome: 'defeat', difficulty: 'lights_out', level: 1, wave: 1, durationSec: 1, players: [] } });
    tracker.ui(ui('game', { hud: hud() }));
    tracker.ui(ui('gameover'));
    tracker.ui(ui('game', { hud: hud() }));
    expect(names().filter((each) => each === 'run_start')).toHaveLength(2);
    expect(names().filter((each) => each === 'run_end')).toHaveLength(1);
  });

  it('sends run_start first and then level_start, even when the level began before the screen did', () => {
    const { tracker, names, last } = setup();
    tracker.event({ type: 'level_start', level: 1 });
    tracker.ui(ui('game', { hud: hud({ level: 1 }) }));
    tracker.event({ type: 'level_start', level: 2 });
    expect(names()).toEqual(['run_start', 'level_start', 'level_start']);
    expect(last('level_start')).toEqual({ level: 2, difficulty: 'lights_out', survivor: 'night' });
  });

  it('reports the room difficulty for a guest, and forgets it afterwards', () => {
    const { tracker, last } = setup();
    tracker.roomDifficulty('undead_tired');
    tracker.ui(ui('game', { mode: 'coop', hud: hud() }));
    expect(last('run_start')?.difficulty).toBe('undead_tired');
    tracker.ui(ui('title'));
    tracker.ui(ui('game', { hud: hud() }));
    expect(last('run_start')?.difficulty).toBe('lights_out');
  });

  it('reports a radio found by this player only', () => {
    const { tracker, names } = setup();
    tracker.localPlayer('p1');
    tracker.ui(ui('game', { hud: hud() }));
    tracker.event({ type: 'pickup', playerId: 'p2', pickup: 'radio', x: 0, y: 0 });
    tracker.event({ type: 'pickup', playerId: 'p1', pickup: 'radio', x: 0, y: 0 });
    expect(names().filter((each) => each === 'radio_found')).toHaveLength(1);
  });
});
