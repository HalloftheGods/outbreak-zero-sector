/** The Sound Test's lists and what is unlocked in them. Everything comes from the real playlists and sound table. */
import { allTracks } from '../audio/playlists.ts';
import type { TrackGroup } from '../audio/playlists.ts';
import { SFX_NAMES } from '../audio/sfx-registry.ts';
import type { SfxName } from '../audio/sfx-registry.ts';
import { isLevelUnlocked } from './level-progress.ts';
import type { LevelProgress } from './level-progress.ts';

/** All the title menu's Sound Test page shows until a Radio is found. */
export const LOCKED_LINE = 'A radio is out there somewhere.';
export const HIDDEN_LABEL = '???';

interface EntryBase {
  readonly id: string;
  readonly name: string;
  /** Where it is heard, which stays readable while the name is hidden. */
  readonly where: string;
  readonly unlocked: boolean;
  /** The name, or ??? while locked. */
  readonly label: string;
}

export interface MusicEntry extends EntryBase {
  readonly kind: 'music';
  readonly file: string;
}

export interface SfxEntry extends EntryBase {
  readonly kind: 'sfx';
  readonly sfx: SfxName;
}

export type SoundEntry = MusicEntry | SfxEntry;

const SMALL_WORDS: ReadonlySet<string> = new Set(['a', 'in', 'into', 'of', 'the', 'to']);
const NAME_PREFIX = /^(?:level-\d+|victory|end-credits)-/;

function titleCase(slug: string, separator: RegExp): string {
  return slug
    .split(separator)
    .filter((word) => word.length > 0)
    .map((word, index) => {
      const small = index > 0 && SMALL_WORDS.has(word);
      return small ? word : word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** A track's name, read from its file: level-02-metro-tunnels.mp3 is Metro Tunnels. */
export function trackName(file: string): string {
  return titleCase(file.replace(/\.[a-z0-9]+$/i, '').replace(NAME_PREFIX, ''), /-/);
}

/** A sound's name, read from its key: dry_click is Dry Click. */
export function sfxName(name: string): string {
  return titleCase(name, /_/);
}

const GROUP_WHERE: Readonly<Record<TrackGroup, string>> = {
  title: 'TITLE',
  horde: 'HORDE',
  level: 'LEVEL',
  victory: 'VICTORY',
  credits: 'CREDITS',
};

/** Victory and credits are heard on finishing the game; the rest need their level reached. */
function trackUnlocked(group: TrackGroup, level: number, progress: LevelProgress): boolean {
  const isEnding = group === 'victory' || group === 'credits';
  return isEnding ? progress.finished : isLevelUnlocked(level, progress);
}

function entryOf(base: Omit<EntryBase, 'label'>): EntryBase {
  return { ...base, label: base.unlocked ? base.name : HIDDEN_LABEL };
}

/** Every recorded track, named once the level it plays in has been reached. */
export function musicEntries(progress: LevelProgress): readonly MusicEntry[] {
  return allTracks().map(({ file, group, level }) => {
    const where = group === 'level' ? `LEVEL ${String(level).padStart(2, '0')}` : GROUP_WHERE[group];
    const unlocked = trackUnlocked(group, level, progress);
    return { ...entryOf({ id: `music:${file}`, name: trackName(file), where, unlocked }), kind: 'music', file };
  });
}

/** Every sound effect. The Radio opens them all, so the page itself is the gate. */
export function sfxEntries(): readonly SfxEntry[] {
  return SFX_NAMES.map((sfx) => ({
    ...entryOf({ id: `sfx:${sfx}`, name: sfxName(sfx), where: 'SOUND', unlocked: true }),
    kind: 'sfx',
    sfx,
  }));
}

/** The part of the audio engine the page plays through. */
export interface Previewer {
  previewTrack(file: string, onEnd: () => void): boolean;
  previewSfx(name: SfxName, onEnd: () => void): boolean;
}

/** Starts an entry, if it is unlocked and the audio could start it. Returns whether something is now playing. */
export function playEntry(entry: SoundEntry, audio: Previewer, onEnd: () => void): boolean {
  if (!entry.unlocked) return false;
  return entry.kind === 'music' ? audio.previewTrack(entry.file, onEnd) : audio.previewSfx(entry.sfx, onEnd);
}
