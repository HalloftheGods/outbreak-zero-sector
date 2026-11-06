/** Decides whether the title screen may offer Install Game, and which way the install goes. */

/** prompt: the browser hands us an install dialog. guide: the player installs by hand, and a card shows how. none: no cartridge. */
export type InstallPath = 'prompt' | 'guide' | 'none';

/** Which hand-made card the guide path shows: Safari's Share sheet, or the menu of any other browser. */
export type GuideKind = 'ios' | 'menu';

export interface InstallFacts {
  /** Running as an installed app already (display-mode: standalone, or iOS navigator.standalone). */
  readonly standalone: boolean;
  /** appinstalled fired during this visit. */
  readonly installedNow: boolean;
  /** A beforeinstallprompt event is held and has not been spent. */
  readonly promptReady: boolean;
  /** The player already answered the native dialog with a no, so the held event is spent. */
  readonly promptSpent: boolean;
  /** iPhone or iPad Safari, which never fires beforeinstallprompt. */
  readonly iosSafari: boolean;
}

export function installPath(facts: InstallFacts): InstallPath {
  const alreadyInstalled = facts.standalone || facts.installedNow;
  if (alreadyInstalled) return 'none';
  if (facts.promptReady) return 'prompt';
  if (facts.iosSafari) return 'guide';
  // A dismissed prompt cannot be shown twice, but the cartridge stays and points at the browser menu.
  if (facts.promptSpent) return 'guide';
  return 'none';
}

export function guideKindFor(facts: InstallFacts): GuideKind {
  return facts.iosSafari ? 'ios' : 'menu';
}

/** iPadOS Safari reports a Mac, so a touch screen on a Mac platform counts as an iPad. */
export function isIosSafari(userAgent: string, platform: string, touchPoints: number): boolean {
  const iPhoneOrPod = /iPhone|iPod/.test(userAgent);
  const iPad = /iPad/.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(userAgent);
  const isSafari = /Safari\//.test(userAgent) || /Version\//.test(userAgent);
  return (iPhoneOrPod || iPad) && isSafari && !otherBrowser;
}

export const STANDALONE_QUERY = '(display-mode: standalone)';
export const FULLSCREEN_QUERY = '(display-mode: fullscreen)';

export function isStandaloneDisplay(matches: (query: string) => boolean, iosStandalone: boolean | undefined): boolean {
  return matches(STANDALONE_QUERY) || matches(FULLSCREEN_QUERY) || iosStandalone === true;
}
