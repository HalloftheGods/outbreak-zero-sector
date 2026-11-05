import { SFX, type SfxName } from './sfx-registry.ts';
import { makeVoice, seeded } from './voice-kit.ts';

/** Render one recipe to a mono buffer, deterministically, for checks and tooling. */
export async function renderSfx(name: SfxName, sampleRate = 44100): Promise<AudioBuffer> {
  const def = SFX[name];
  const ctx = new OfflineAudioContext(1, Math.ceil((def.length + 0.15) * sampleRate), sampleRate);
  const trim = ctx.createGain();
  trim.gain.value = def.gain;
  trim.connect(ctx.destination);
  def.play(makeVoice(ctx, trim, 0, 1, seeded(1234)));
  return ctx.startRendering();
}
