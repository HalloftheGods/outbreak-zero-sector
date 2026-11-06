import { FINAL_LEVEL, FIRST_LEVEL } from '../../shared/levels.ts';
import type { Scene } from './music.ts';

export interface Playlist {
  readonly files: readonly string[];
  /** A horde starts its track from the top; the quiet scenes pick up where they stopped. */
  readonly fromTop: boolean;
}

const quiet = (): Playlist => ({ files: [], fromTop: false });
const lull = (...files: string[]): Playlist => ({ files, fromTop: false });

const RUINS = lull('silent-ruins-variation.mp3');
const HORDE: Playlist = { files: ['horde-attack.mp3', 'horde-attack-alt.mp3'], fromTop: true };
const QUIET = quiet();
const VICTORY: Playlist = { files: ['victory-dark-salvation.mp3'], fromTop: true };
const CREDITS: Playlist = { files: ['end-credits-surviving-the-night.mp3'], fromTop: true };

/** The music between hordes in each town, in the order of LEVELS. A level with multiple takes plays them in turn. */
export const LULLS: readonly Playlist[] = [
  lull('silent-ruins.mp3', 'level-01-abandoned-streets.mp3'),
  lull('escalation.mp3', 'escalation-hard.mp3', 'level-02-metro-tunnels.mp3'),
  lull('level-03-into-the-breach.mp3', 'level-03-factory-raid.mp3'),
  lull('level-04-abyssal-depths.mp3', 'level-04-overgrown-hospital.mp3'),
  lull('level-05-contamination-zone.mp3', 'level-05-highway-escape.mp3'),
  lull('level-06-underground-bunker.mp3', 'level-06-toxic-silo.mp3'),
  lull('level-07-quarantine-breach.mp3', 'level-07-quarantine-breach-alt.mp3', 'level-07-outpost-siege.mp3'),
  lull('level-08-frozen-wasteland.mp3', 'level-08-frozen-military-base.mp3'),
  lull('level-09-the-hive.mp3', 'level-09-the-hive-alt.mp3', 'level-09-nesting-grounds.mp3'),
  lull('level-10-final-stand.mp3', 'level-10-final-evacuation.mp3'),
];

export type TrackGroup = 'title' | 'horde' | 'level' | 'victory' | 'credits';

export interface TrackInfo {
  readonly file: string;
  readonly group: TrackGroup;
  /** The level that has to be reached to hear it in a run. The title and the first horde belong to the first. */
  readonly level: number;
}

const tracksOf = (playlist: Playlist, group: TrackGroup, level: number): TrackInfo[] =>
  playlist.files.map((file) => ({ file, group, level }));

/** Every recorded track, read from the playlists above so the Sound Test keeps no list of its own. */
export function allTracks(): readonly TrackInfo[] {
  return [
    ...tracksOf(RUINS, 'title', FIRST_LEVEL),
    ...tracksOf(HORDE, 'horde', FIRST_LEVEL),
    ...LULLS.flatMap((playlist, index) => tracksOf(playlist, 'level', FIRST_LEVEL + index)),
    ...tracksOf(VICTORY, 'victory', FINAL_LEVEL),
    ...tracksOf(CREDITS, 'credits', FINAL_LEVEL),
  ];
}

/** What plays in a scene on a level. Levels past either end of the run hold to the nearest. */
export function playlistFor(scene: Scene, level: number): Playlist {
  if (scene === 'menu') return RUINS;
  if (scene === 'wave') return HORDE;
  if (scene === 'victory') return VICTORY;
  if (scene === 'credits') return CREDITS;
  if (scene === 'gameover') return QUIET;
  const index = Math.min(FINAL_LEVEL, Math.max(FIRST_LEVEL, Math.floor(level))) - FIRST_LEVEL;
  return LULLS[index] ?? LULLS[0];
}