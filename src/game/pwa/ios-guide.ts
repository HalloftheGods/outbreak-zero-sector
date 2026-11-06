/** The words and pictures of the how to install card. Each step names an icon that src/art/cartridge.ts draws. */
import type { GuideKind } from './install-offer.ts';

export type GuideIcon = 'share' | 'plus' | 'menu' | 'download';

export interface GuideStep {
  readonly icon: GuideIcon;
  readonly title: string;
  readonly line: string;
}

export interface Guide {
  readonly kicker: string;
  readonly heading: string;
  readonly steps: readonly GuideStep[];
}

const IOS_GUIDE: Guide = {
  kicker: 'Field notes',
  heading: 'Keep it on your home screen',
  steps: [
    { icon: 'share', title: 'Tap Share', line: 'The square with an arrow, in the Safari toolbar.' },
    { icon: 'plus', title: 'Add to Home Screen', line: 'Scroll the sheet up, tap it, then tap Add.' },
  ],
};

const MENU_GUIDE: Guide = {
  kicker: 'Field notes',
  heading: 'Keep it on your device',
  steps: [
    { icon: 'menu', title: 'Open the browser menu', line: 'Usually three dots or lines, near the address bar.' },
    { icon: 'download', title: 'Install app', line: 'Look for Install app or Add to Home Screen.' },
  ],
};

export function guideFor(kind: GuideKind): Guide {
  return kind === 'ios' ? IOS_GUIDE : MENU_GUIDE;
}
