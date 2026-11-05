import { describe, expect, it } from 'vitest';
import { HEARING_RANGE, spatialize } from '../src/audio/mixer.ts';
import { SFX, SFX_NAMES } from '../src/audio/sfx-registry.ts';
import { makeVoice, seeded } from '../src/audio/voice-kit.ts';

function deep(): any {
  const kids = new Map<PropertyKey, unknown>();
  return new Proxy(function () { /* callable */ }, {
    get: (_t, k) => {
      if (!kids.has(k)) kids.set(k, deep());
      return kids.get(k);
    },
    set: () => true,
    apply: () => deep(),
  });
}

describe('sfx registry', () => {
  const required = [
    'pistol', 'carbine', 'shotgun', 'dry_click', 'mag_out', 'mag_in', 'pump', 'weapon_switch', 'impact',
    'flesh_hit', 'die_walker', 'die_runner', 'die_bloater', 'die_brute', 'claw', 'groan_walker',
    'shriek_runner', 'gurgle_bloater', 'roar_brute', 'bloater_burst', 'player_hurt', 'player_downed',
    'revive', 'heartbeat', 'pickup_medkit', 'pickup_ammo', 'pickup_weapon', 'wave_start', 'wave_clear',
    'pickup_bandage', 'pickup_pistol_ammo', 'pickup_carbine_ammo', 'pickup_shells', 'melee_swing', 'melee_thud', 'heal',
    'alert_walker', 'alert_runner', 'alert_bloater', 'alert_brute',
    'game_over', 'ui_click', 'ui_hover', 'ui_start', 'ui_pause', 'ui_resume',
  ];

  it('has every required sound with sane limits', () => {
    for (const n of required) expect(SFX_NAMES).toContain(n);
    for (const n of SFX_NAMES) {
      const d = SFX[n];
      expect(d.length).toBeGreaterThan(0);
      expect(d.gain).toBeGreaterThan(0);
      expect(d.voices).toBeGreaterThan(0);
    }
  });

  it('every recipe runs against a context without throwing', () => {
    for (const n of SFX_NAMES) {
      const ctx: any = { sampleRate: 44100, createBuffer: (_c: number, l: number) => ({ getChannelData: () => new Float32Array(l) }) };
      const proxy = new Proxy(ctx, { get: (t, k: string) => (k in t ? t[k] : () => deep()) });
      expect(() => SFX[n].play(makeVoice(proxy, deep(), 0, 1, seeded(1)))).not.toThrow();
    }
  });
});

describe('spatialize', () => {
  it('culls beyond hearing range', () => {
    expect(spatialize(0, 0, HEARING_RANGE, 0)).toBeNull();
    expect(spatialize(0, 0, 0, HEARING_RANGE + 50)).toBeNull();
  });

  it('is loudest up close and fades with distance', () => {
    const near = spatialize(0, 0, 10, 0)!;
    const far = spatialize(0, 0, 300, 0)!;
    expect(near.gain).toBeGreaterThan(far.gain);
    expect(near.gain).toBeLessThanOrEqual(1);
  });

  it('pans toward the side of the source', () => {
    expect(spatialize(0, 0, -100, 0)!.pan).toBeLessThan(0);
    expect(spatialize(0, 0, 100, 0)!.pan).toBeGreaterThan(0);
    expect(spatialize(0, 0, 0, 100)!.pan).toBe(0);
  });
});
