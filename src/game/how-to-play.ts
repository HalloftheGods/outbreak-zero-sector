/** What the How to Play screen says. Edit the words here; the screen only lays them out. */
export interface HowToSection {
  readonly id: string;
  /** Short enough for a tab. */
  readonly tab: string;
  readonly title: string;
  /** One short line each. */
  readonly points: readonly string[];
}

export const HOW_TO_SECTIONS: readonly HowToSection[] = [
  {
    id: 'goal',
    tab: 'Goal',
    title: 'Survive the night',
    points: [
      "Survive each town's hordes and reach the escape van.",
      'There are ten levels. The last round is the tenth.',
      'Every town is a new map, with more and tougher zombies.',
    ],
  },
  {
    id: 'controls',
    tab: 'Controls',
    title: 'Controls',
    points: [
      'WASD: move.',
      'Mouse: aim. Hold to fire.',
      'R: reload. 1 2 3 or Q: switch weapon.',
      'E: hold to search furniture.',
      'F or right click: Shove & Stab.',
      'H: use a medkit.',
      'Tab or N: town map. M: mute. Esc: pause.',
      'Touch: put your left thumb down and drag to move.',
      'Touch anywhere else to aim there and fire. Tap a head for a headshot. Hold and drag to keep firing.',
      'The buttons along the edge do the rest. Hold Search.',
    ],
  },
  {
    id: 'noise',
    tab: 'Noise',
    title: 'Noise draws zombies',
    points: [
      'Gunshots carry. Zombies come to the sound.',
      'Shoving is silent.',
      'Searching can knock something over and make noise.',
      'Stay quiet and let them wander past.',
    ],
  },
  {
    id: 'supplies',
    tab: 'Supplies',
    title: 'Ammo and health',
    points: [
      'Ammo and health are finite. Nothing refills on its own.',
      'Each gun has its own ammo.',
      'Headshots save ammo. The crosshair turns red over a head. Shotguns get no bonus.',
      'Search buildings for ammo, medkits and bandages.',
      'Low and empty ammo warnings show on the HUD.',
    ],
  },
  {
    id: 'searching',
    tab: 'Searching',
    title: 'Searching furniture',
    points: [
      'Stand still next to furniture and hold E.',
      'Whatever is inside drops at your feet.',
      'Each piece can be searched once.',
      'Some searches are loud.',
    ],
  },
  {
    id: 'melee',
    tab: 'Knife',
    title: 'The knife and Shove & Stab',
    points: [
      'When the ammo runs out you can still shove. It pushes zombies back and makes no noise.',
      'Find a knife in a diner, a home, a garage or a drawer, and it becomes Shove & Stab.',
      'A stab hits over four times as hard and is just as quiet.',
      'The knife stays with you from town to town. You lose it if you die.',
    ],
  },
  {
    id: 'hordes',
    tab: 'Hordes',
    title: 'Hordes and quiet stretches',
    points: [
      'Zombies roam the town and notice by sight and sound.',
      'Hordes arrive after a quiet stretch. A siren warns you.',
      'Use the quiet to search, heal and reload.',
    ],
  },
  {
    id: 'van',
    tab: 'The van',
    title: 'The escape van',
    points: [
      'Each town has a van at the exit.',
      'Stand beside it for two seconds to leave.',
      'The van is solid. Zombies and bullets cannot pass it.',
    ],
  },
  {
    id: 'workbench',
    tab: 'Workbench',
    title: 'Workbench and gun upgrades',
    points: [
      'Loot gun parts: barrels, grips, magazines and suppressors.',
      'Fit them at a workbench to upgrade a gun.',
      'Upgrades add damage, fire rate, magazine size, reload speed or a suppressor.',
      'A gun has only so many upgrade slots.',
    ],
  },
  {
    id: 'survivors',
    tab: 'Survivors',
    title: 'Five survivors',
    points: [
      'Night: harder for zombies to see.',
      'Khronus8: reloads faster.',
      'Satori: runs faster.',
      'Rex: shoves harder.',
      'Sol: finds more in searches and on kills.',
    ],
  },
  {
    id: 'difficulty',
    tab: 'Difficulty',
    title: 'Difficulty modes',
    points: [
      'Night Light On: plenty of ammo, slow weak zombies, small hordes.',
      'Stay Close: more ammo, slightly slower zombies, smaller hordes.',
      'Lights Out: the game as it was built.',
      'Undead Tired: scarce ammo, fast hard-hitting zombies, big hordes.',
    ],
  },
  {
    id: 'coop',
    tab: 'Co-op',
    title: 'Co-op',
    points: [
      'Press Play, pick Multiplayer, enter a server address, then press Next and Join.',
      'Everyone shares one town and one set of zombies.',
      'Noise from any player draws zombies to everyone.',
      'The first player into a room sets its difficulty.',
    ],
  },
];
