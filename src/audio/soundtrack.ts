import type { Scene } from './music.ts';
import { playlistFor } from './playlists.ts';
import type { Playlist } from './playlists.ts';

/** Fade time constant in seconds; a track is inaudible after about three of these. */
const FADE_TC = 0.4;
const SILENT_AFTER_MS = 1600;

/** The parts of an audio element this class touches, so a spec can stand in for one. */
const firstTurn = (playlist: Playlist): number =>
  playlist.fromTop ? 0 : Math.floor(Math.random() * playlist.files.length);

export type TrackElement = Pick<HTMLAudioElement, 'currentTime' | 'paused' | 'preload' | 'play' | 'pause' | 'addEventListener'>;

interface Track {
  readonly element: TrackElement;
  readonly gain: GainNode;
  silencing: ReturnType<typeof setTimeout> | null;
}

/**
 * The recorded music. Tracks stream through audio elements, since decoding three
 * minutes of each into memory would cost far more than the files, and pass through
 * the mixer so volume and mute still apply. If one will not load, onAvailable(false)
 * hands the scene back to the generated bed.
 */
export class Soundtrack {
  private readonly tracks = new Map<string, Track>();
  private readonly turns = new Map<Playlist, number>();
  private playlist: Playlist | null = null;
  private scene: Scene = 'menu';
  private level = 1;
  private current: Track | null = null;
  /** Set while the Sound Test is playing one track on its own. */
  private auditionEnd: (() => void) | null = null;
  private readonly listening = new AbortController();

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly onAvailable: (available: boolean) => void,
    private readonly makeElement: (src: string) => TrackElement & HTMLMediaElement = (src) => new Audio(src),
  ) {}

  setScene(scene: Scene): void {
    this.scene = scene;
    this.retune();
  }

  /** The town being played picks the music between hordes. */
  setLevel(level: number): void {
    this.level = level;
    this.retune();
  }

  /** Steps the scene's music aside, so the Sound Test starts quiet and plays only what is chosen. */
  hush(): void {
    this.auditionEnd ??= () => undefined;
    this.fadeOut(this.current);
    this.current = null;
  }

  /** Plays one file by itself, in place of any other. onEnd runs if it plays out. */
  audition(file: string, onEnd: () => void): void {
    this.hush();
    this.auditionEnd = onEnd;
    const track = this.trackFor(file);
    track.element.currentTime = 0;
    this.current = track;
    this.start(track);
  }

  /** Stops what is auditioning and stays quiet. */
  silence(): void {
    if (this.auditionEnd) this.auditionEnd = () => undefined;
    this.hush();
  }

  /** Ends the Sound Test's hold and brings the scene's music back. */
  stopAudition(): void {
    if (!this.auditionEnd) return;
    this.auditionEnd = null;
    this.fadeOut(this.current);
    this.current = null;
    this.playlist = null;
    this.retune();
  }

  private retune(): void {
    if (this.auditionEnd) return;
    const playlist = playlistFor(this.scene, this.level);
    const unchanged = playlist === this.playlist;
    if (unchanged) return;
    this.playlist = playlist;
    this.fadeOut(this.current);
    this.current = null;
    this.playNext();
  }

  /** Browsers refuse to start audio before a gesture, so each gesture tries again. */
  retry(): void {
    const stalled = this.current?.element.paused;
    if (stalled) this.start(this.current as Track);
  }

  dispose(): void {
    this.listening.abort();
    for (const track of this.tracks.values()) {
      if (track.silencing) clearTimeout(track.silencing);
      track.element.pause();
    }
    this.tracks.clear();
    this.current = null;
    this.auditionEnd = null;
    this.playlist = null;
  }

  private playNext(): void {
    const playlist = this.playlist;
    const nothingToPlay = !playlist || playlist.files.length === 0;
    if (nothingToPlay) return;
    // A level's first track is a random one of its takes; the rest follow in turn so the music never stops.
    const turn = this.turns.get(playlist) ?? firstTurn(playlist);
    this.turns.set(playlist, turn + 1);
    const track = this.trackFor(playlist.files[turn % playlist.files.length]);
    if (playlist.fromTop) track.element.currentTime = 0;
    this.current = track;
    this.start(track);
  }

  private trackFor(file: string): Track {
    const known = this.tracks.get(file);
    if (known) return known;
    const element = this.makeElement(`music/${file}`);
    element.preload = 'auto';
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    this.ctx.createMediaElementSource(element).connect(gain);
    gain.connect(this.out);
    const track: Track = { element, gain, silencing: null };
    const { signal } = this.listening;
    element.addEventListener('playing', () => this.onAvailable(true), { signal });
    element.addEventListener('error', () => this.onAvailable(false), { signal });
    element.addEventListener('ended', () => this.onEnded(track), { signal });
    this.tracks.set(file, track);
    return track;
  }

  private onEnded(track: Track): void {
    const stillOurs = track === this.current;
    if (!stillOurs) return;
    const playedOut = this.auditionEnd;
    if (playedOut) {
      this.silence();
      playedOut();
      return;
    }
    track.element.currentTime = 0;
    this.playNext();
  }

  private start(track: Track): void {
    if (track.silencing) clearTimeout(track.silencing);
    track.silencing = null;
    track.gain.gain.setTargetAtTime(1, this.ctx.currentTime, FADE_TC);
    // A refusal before the first gesture is not a failure: retry() covers it.
    void track.element.play().catch(() => undefined);
  }

  private fadeOut(track: Track | null): void {
    if (!track) return;
    track.gain.gain.setTargetAtTime(0, this.ctx.currentTime, FADE_TC);
    track.silencing = setTimeout(() => track.element.pause(), SILENT_AFTER_MS);
  }
}
