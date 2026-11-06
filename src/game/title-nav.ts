// Where the title screen is: the open page, whether an invite link brought the player here, and the level picked on the Levels page. Every move is decided here.

import type { TitlePage } from './title-menu.ts';

export interface TitleNav {
  readonly page: TitlePage | null;
  /** An invite link opened Play, and the room decides the style. It settles that first visit only: leaving the page ends it. */
  readonly invited: boolean;
  /** Set when a level was picked on the Levels page, so Play starts there and Back returns to the Levels page. */
  readonly startLevel: number | null;
}

export const TITLE_HOME: TitleNav = { page: null, invited: false, startLevel: null };

/** Arriving on an invite link (?join=): Play, already open. */
export const INVITE_LANDING: TitleNav = { page: 'play', invited: true, startLevel: null };

export function openPage(nav: TitleNav, page: TitlePage): TitleNav {
  return { ...nav, page };
}

export function pickLevel(nav: TitleNav, level: number): TitleNav {
  return { ...nav, page: 'play', startLevel: level };
}

/** Back from Play: to the Levels page if a level sent the player there, else the title. Either way the invite is spent. */
export function closePlay(nav: TitleNav): TitleNav {
  const cameFromLevels = nav.startLevel !== null;
  return { page: cameFromLevels ? 'levels' : null, invited: false, startLevel: null };
}

/** Back from any other page to the title. */
export function closePage(nav: TitleNav): TitleNav {
  return { ...nav, page: null, invited: false };
}
