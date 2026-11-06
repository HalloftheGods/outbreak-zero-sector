/**
 * The words of the Privacy page. Each line says only what the code in this folder does: if analytics
 * changes, change these lines in the same commit.
 *
 * REVIEW NEEDED: written by the developers, not a lawyer. Someone qualified should read it before it is
 * relied on, and it deliberately names no company, address or contact because none was given.
 */

export interface PrivacySection {
  readonly heading: string;
  readonly lines: readonly string[];
}

export const PRIVACY_TITLE = 'Privacy';

export const PRIVACY_SECTIONS: readonly PrivacySection[] = [
  {
    heading: 'Your choice',
    lines: [
      'Analytics is on by default. Gameplay stats go to Google Analytics unless you turn it off in Options.',
      'If your browser sends the Global Privacy Control signal, the game treats that as off and sends nothing. Options shows it as off.',
      'Your choice is saved in this browser only. You can change it any time in Options.',
    ],
  },
  {
    heading: 'What is sent',
    lines: [
      'Which screens you open: the title, How to Play, play setup and Sound Test.',
      'When a run starts and ends: the survivor, difficulty, solo or co-op, starting level, touch or mouse, and screen orientation.',
      'For each level: the level, seconds taken, times downed, ammo left, shots fired and dry fires.',
      'At the end of a run: win or lose, level reached, seconds, and a score range, not the exact score.',
      'Workbench visits, which gun effect you fitted, and radios found.',
      'Whether you opened an invite link or joined co-op.',
      'When you press the Install Game cartridge, and whether it opened the browser’s install prompt or the how-to-install steps. Also when the browser reports the game was installed.',
      'Once per run: your average frame rate as a range, and whether the device is touch or desktop.',
      'If the game fails: the kind of error only, never its message.',
    ],
  },
  {
    heading: 'What is not sent',
    lines: [
      'Your callsign, anything you type, chat, or your player id.',
      'Server addresses or invite links. Google is sent the page address without anything after the question mark.',
      'Shot-by-shot data. The game sends one summary per level or run.',
    ],
  },
  {
    heading: 'Google Analytics',
    lines: [
      'Google Analytics processes this data. The game loads Google’s script when analytics is on.',
      'Like any request to Google, it receives your IP address and browser details, and Google sets cookies beginning with _ga to tell visits apart.',
      'The game turns off Google’s advertising features for this tag.',
      'Nothing is sent from a developer machine or a development build.',
    ],
  },
  {
    heading: 'Turning it off',
    lines: [
      'Use the Analytics button in Options. Turning it off stops sending at once and removes the _ga cookies where your browser allows.',
      'The game also saves your progress and settings in this browser. They stay on your device.',
    ],
  },
];
