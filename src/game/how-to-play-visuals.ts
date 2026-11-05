// Maps each How to Play section to authentic in-game pixel art sprites, badges and descriptions.

import type { ArtBook, PixelSprite } from '../art/types.ts';

export interface VisualCard {
  readonly id: string;
  readonly title: string;
  readonly sprite: PixelSprite;
  readonly scale?: number;
  readonly subtitle?: string;
  readonly badge?: string;
}

/** Returns visual cards for a given How to Play section ID. */
export function getSectionVisuals(sectionId: string, art: ArtBook): readonly VisualCard[] {
  switch (sectionId) {
    case 'goal':
      return [
        {
          id: 'van',
          title: 'Escape Van',
          sprite: art.environment.escapeVan,
          scale: 1.5,
          subtitle: 'Wait 2 seconds beside the van to exit',
          badge: 'TARGET',
        },
        {
          id: 'hordes',
          title: '10 Rounds',
          sprite: art.ui.skull,
          scale: 2,
          subtitle: 'Survive all waves to open the exit',
          badge: 'SURVIVE',
        },
      ];

    case 'controls':
      return [
        {
          id: 'survivor',
          title: 'Survivor',
          sprite: art.survivors[0].portrait,
          scale: 1.5,
          subtitle: 'Move: WASD keys',
          badge: 'MOVE',
        },
        {
          id: 'crosshair',
          title: 'Crosshair',
          sprite: art.ui.crosshair,
          scale: 2,
          subtitle: 'Aim: Mouse | Hold to fire',
          badge: 'AIM',
        },
        {
          id: 'headshot',
          title: 'Headshot',
          sprite: art.ui.crosshairHead,
          scale: 2,
          subtitle: 'Turns red on head: bonus dmg',
          badge: 'CRIT',
        },
      ];

    case 'noise':
      return [
        {
          id: 'gunfire',
          title: 'Gunfire',
          sprite: art.ui.weaponIcons.pistol,
          scale: 1.5,
          subtitle: 'Gunshots carry across the town',
          badge: 'LOUD',
        },
        {
          id: 'silent-melee',
          title: 'Shove & Melee',
          sprite: art.ui.pickupIcons.knife,
          scale: 2,
          subtitle: 'Shoving & knife stabs make 0 noise',
          badge: 'SILENT',
        },
      ];

    case 'supplies':
      return [
        {
          id: 'pistol-ammo',
          title: '9mm Ammo',
          sprite: art.ui.pickupIcons.pistol_ammo,
          scale: 2,
          subtitle: 'Standard sidearm ammunition',
        },
        {
          id: 'carbine-ammo',
          title: '5.56 Ammo',
          sprite: art.ui.pickupIcons.carbine_ammo,
          scale: 2,
          subtitle: 'Rifle high-capacity ammunition',
        },
        {
          id: 'shells',
          title: 'Shotgun Shells',
          sprite: art.ui.pickupIcons.shells,
          scale: 2,
          subtitle: 'Heavy close-range buckshot',
        },
        {
          id: 'medkit',
          title: 'Medkit',
          sprite: art.ui.pickupIcons.medkit,
          scale: 2,
          subtitle: 'Restores a large amount of health',
          badge: 'HEAL',
        },
        {
          id: 'bandage',
          title: 'Bandage',
          sprite: art.ui.pickupIcons.bandage,
          scale: 2,
          subtitle: 'Quick patch for minor injuries',
        },
      ];

    case 'searching':
      return [
        {
          id: 'car',
          title: 'Street Cars',
          sprite: art.containers.car.closed,
          scale: 1.5,
          subtitle: 'Search sedans and wrecks outdoors',
        },
        {
          id: 'box',
          title: 'Boxes & Crates',
          sprite: art.containers.box.closed,
          scale: 2,
          subtitle: 'Search cardboard boxes in alleys',
        },
        {
          id: 'shelf',
          title: 'Metal Shelves',
          sprite: art.containers.shelf.closed,
          scale: 2,
          subtitle: 'Search grocery and garage shelves',
        },
        {
          id: 'drawer',
          title: 'Drawers',
          sprite: art.containers.drawer.closed,
          scale: 2,
          subtitle: 'Search dressers and office desks',
        },
        {
          id: 'locker',
          title: 'Lockers',
          sprite: art.containers.locker.closed,
          scale: 1.5,
          subtitle: 'Search gun shop and clinic lockers',
        },
        {
          id: 'fridge',
          title: 'Fridge',
          sprite: art.containers.fridge.closed,
          scale: 1.5,
          subtitle: 'Search residential refrigerators',
        },
      ];

    case 'melee':
      return [
        {
          id: 'knife',
          title: 'Hunting Knife',
          sprite: art.ui.pickupIcons.knife,
          scale: 2,
          subtitle: 'Shove & Stab deals 4x silent damage',
          badge: '4X DMG',
        },
      ];

    case 'hordes':
      return [
        {
          id: 'walker',
          title: 'Walker',
          sprite: art.zombies.walker.walk[2].frames[0],
          scale: 2,
          subtitle: 'Slow roamers; dangerous in swarms',
          badge: 'SLOW',
        },
        {
          id: 'runner',
          title: 'Runner',
          sprite: art.zombies.runner.walk[2].frames[0],
          scale: 2,
          subtitle: 'Sprints directly at survivors on sight',
          badge: 'FAST',
        },
        {
          id: 'bloater',
          title: 'Bloater',
          sprite: art.zombies.bloater.walk[2].frames[0],
          scale: 2,
          subtitle: 'Detonates in a lethal toxic acid cloud',
          badge: 'ACID',
        },
        {
          id: 'brute',
          title: 'Brute',
          sprite: art.zombies.brute.walk[2].frames[0],
          scale: 2,
          subtitle: 'Huge armored tank with high damage',
          badge: 'TANK',
        },
      ];

    case 'van':
      return [
        {
          id: 'escape-van',
          title: 'The Escape Van',
          sprite: art.environment.escapeVan,
          scale: 1.5,
          subtitle: 'Blocks bullets and zombies; hold 2s to leave',
          badge: 'SHIELD',
        },
      ];

    case 'workbench':
      return [
        {
          id: 'barrel',
          title: 'Extended Barrel',
          sprite: art.ui.pickupIcons.barrel,
          scale: 2,
          subtitle: 'Increases bullet damage and range',
          badge: 'BARREL',
        },
        {
          id: 'grip',
          title: 'Tactical Grip',
          sprite: art.ui.pickupIcons.grip,
          scale: 2,
          subtitle: 'Improves fire rate and recoil',
          badge: 'GRIP',
        },
        {
          id: 'magazine',
          title: 'Mag Extension',
          sprite: art.ui.pickupIcons.magazine,
          scale: 2,
          subtitle: 'More rounds before needing reload',
          badge: 'MAG',
        },
        {
          id: 'suppressor',
          title: 'Suppressor',
          sprite: art.ui.pickupIcons.suppressor,
          scale: 2,
          subtitle: 'Silences gunfire to avoid hordes',
          badge: 'SILENT',
        },
        {
          id: 'toolkit',
          title: 'Gunsmith Tools',
          sprite: art.ui.pickupIcons.toolkit,
          scale: 2,
          subtitle: 'Fit parts to weapons at workbench',
          badge: 'CRAFT',
        },
      ];

    case 'survivors':
      return [
        {
          id: 'night',
          title: 'Night',
          sprite: art.survivors[0].portrait,
          scale: 1.5,
          subtitle: 'Moves quietly: 25% lower detection',
          badge: 'STEALTH',
        },
        {
          id: 'khronus8',
          title: 'Khronus8',
          sprite: art.survivors[1].portrait,
          scale: 1.5,
          subtitle: 'Fast hands: 25% faster reload',
          badge: 'RELOAD',
        },
        {
          id: 'satori',
          title: 'Satori',
          sprite: art.survivors[2].portrait,
          scale: 1.5,
          subtitle: 'Speed demon: 12% faster sprint',
          badge: 'SPEED',
        },
        {
          id: 'rex',
          title: 'Rex',
          sprite: art.survivors[3].portrait,
          scale: 1.5,
          subtitle: 'Brawler: shoves 50% farther back',
          badge: 'FORCE',
        },
        {
          id: 'sol',
          title: 'Sol',
          sprite: art.survivors[4].portrait,
          scale: 1.5,
          subtitle: 'Lucky scavenger: 2x drops & search luck',
          badge: 'LUCK',
        },
      ];

    case 'difficulty':
      return [
        {
          id: 'diff-easy',
          title: 'Night Light On',
          sprite: art.ui.heart,
          scale: 2,
          subtitle: 'Plentiful ammo, slower zombies',
          badge: 'EASY',
        },
        {
          id: 'diff-normal',
          title: 'Lights Out',
          sprite: art.ui.skull,
          scale: 2,
          subtitle: 'Standard balanced survival mode',
          badge: 'NORMAL',
        },
        {
          id: 'diff-hard',
          title: 'Undead Tired',
          sprite: art.ui.skull,
          scale: 2,
          subtitle: 'Scarce ammo, fast zombies, huge hordes',
          badge: 'HARDCORE',
        },
      ];

    case 'coop':
      return [
        {
          id: 'coop-team',
          title: 'Multiplayer Co-op',
          sprite: art.survivors[0].portrait,
          scale: 1.5,
          subtitle: 'Share one town and coordinate fire',
          badge: 'TEAM',
        },
        {
          id: 'coop-threat',
          title: 'Shared Threat',
          sprite: art.zombies.walker.walk[2].frames[0],
          scale: 2,
          subtitle: 'Noise from any player draws zombies to all',
          badge: 'ALERT',
        },
      ];

    default:
      return [];
  }
}
