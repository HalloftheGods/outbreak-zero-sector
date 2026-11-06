/** Build step for the installable app: stamps the service worker with this build's id and the files of its shell. */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const WORKER_FILE = 'sw.js';
const BUILD_ID_LINE = "const BUILD_ID = 'dev';";
const SHELL_FILES_LINE = 'const SHELL_FILES = [];';
const MUSIC_VERSIONS_LINE = 'const MUSIC_VERSIONS = {};';

/** The shell is every built file except the worker and the music, which is kept track by track as it plays. */
export function isShellFile(file: string): boolean {
  const music = file.startsWith('music/');
  const worker = file === WORKER_FILE;
  const sourceMap = file.endsWith('.map');
  return !music && !worker && !sourceMap;
}

export type MusicVersions = Readonly<Record<string, string>>;

export function stampWorker(source: string, buildId: string, shellFiles: readonly string[], musicVersions: MusicVersions = {}): string {
  const hasStamps = [BUILD_ID_LINE, SHELL_FILES_LINE, MUSIC_VERSIONS_LINE].every((line) => source.includes(line));
  if (!hasStamps) throw new Error('sw.js has lost the lines the build stamps');
  return source
    .replace(BUILD_ID_LINE, `const BUILD_ID = ${JSON.stringify(buildId)};`)
    .replace(SHELL_FILES_LINE, `const SHELL_FILES = ${JSON.stringify(shellFiles)};`)
    .replace(MUSIC_VERSIONS_LINE, `const MUSIC_VERSIONS = ${JSON.stringify(musicVersions)};`);
}

/** A short hash of each music file, so a replaced track is a new key while an unchanged one stays kept. */
export function musicVersionsOf(files: ReadonlyArray<readonly [string, Uint8Array]>): MusicVersions {
  const versions: Record<string, string> = {};
  for (const [file, contents] of files) {
    if (file.startsWith('music/')) versions[file] = buildIdOf([contents]);
  }
  return versions;
}

export function buildIdOf(contents: readonly Uint8Array[]): string {
  const hash = createHash('sha1');
  for (const each of contents) hash.update(each);
  return hash.digest('hex').slice(0, 10);
}

function filesUnder(root: string, folder = ''): string[] {
  const here = path.join(root, folder);
  return readdirSync(here).flatMap((name) => {
    const relative = folder === '' ? name : `${folder}/${name}`;
    const isFolder = statSync(path.join(root, relative)).isDirectory();
    return isFolder ? filesUnder(root, relative) : [relative];
  });
}

export function pwaShell(): Plugin {
  return {
    name: 'uon-pwa-shell',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const workerPath = path.join(outDir, WORKER_FILE);
      const hasWorker = existsSync(workerPath);
      if (!hasWorker) return;
      const shell = filesUnder(outDir).filter(isShellFile).sort();
      const contents = shell.map((file) => readFileSync(path.join(outDir, file)));
      const music = filesUnder(outDir).filter((file) => file.startsWith('music/')).sort();
      const musicVersions = musicVersionsOf(music.map((file) => [file, readFileSync(path.join(outDir, file))] as const));
      const stamped = stampWorker(readFileSync(workerPath, 'utf8'), buildIdOf(contents), shell, musicVersions);
      writeFileSync(workerPath, stamped);
    },
  };
}
