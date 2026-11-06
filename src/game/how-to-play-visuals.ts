import type { ArtBook } from '../art/types.ts';
import type { GalleryCard } from './magazine-types.ts';

/** The game's own pictures for each How to Play section. The captions are the magazine's voice, never new rules. */
type CardList = (art: ArtBook) => readonly GalleryCard[];

const SOUTH = 2;

const zombieFront = (art: ArtBook, type: keyof ArtBook['zombies']) => art.zombies[type].walk[SOUTH].frames[0];

const supplies: CardList = (art) => [
  { id: 'pistol-ammo', title: 'Pistol rounds', sprite: art.ui.pickupIcons.pistol_ammo, scale: 4, tag: 'No. 101', caption: 'For the pistol. Only the pistol.' },
  { id: 'carbine-ammo', title: 'Carbine rounds', sprite: art.ui.pickupIcons.carbine_ammo, scale: 4, tag: 'No. 102', caption: 'Will not fit the pistol. We asked.' },
  { id: 'shells', title: 'Shotgun shells', sprite: art.ui.pickupIcons.shells, scale: 4, tag: 'No. 103', caption: 'Bulky, loud and worth it.' },
  { id: 'medkit', title: 'Medkit', sprite: art.ui.pickupIcons.medkit, scale: 4, tag: 'No. 201', caption: 'Press H. Feel better.' },
  { id: 'bandage', title: 'Bandage', sprite: art.ui.pickupIcons.bandage, scale: 4, tag: 'No. 202', caption: 'For when a medkit feels like showing off.' },
];

const searching: CardList = (art) => [
  { id: 'fridge', title: 'Fridge', sprite: art.containers.fridge.closed, scale: 1.5, tag: 'Kitchen', caption: 'Cold, dark, one careful owner.' },
  { id: 'car', title: 'Car', sprite: art.containers.car.closed, scale: 1.25, tag: 'Street', caption: 'Low mileage. Nobody is coming back for it.' },
  { id: 'locker', title: 'Locker', sprite: art.containers.locker.closed, scale: 1.5, tag: 'Secure', caption: 'Lockable. Not locked.' },
  { id: 'shelf', title: 'Shelf', sprite: art.containers.shelf.closed, scale: 1.5, tag: 'Retail', caption: 'Generous storage, sadly unattended.' },
  { id: 'box', title: 'Box', sprite: art.containers.box.closed, scale: 1.25, tag: 'Bargain', caption: 'Contents unknown. Seller unavailable.' },
  { id: 'drawer', title: 'Drawer', sprite: art.containers.drawer.closed, scale: 1.1, tag: 'Bedroom', caption: 'Sleeps one. Asks no questions.' },
];

const hordes: CardList = (art) => [
  { id: 'walker', title: 'Walker', sprite: zombieFront(art, 'walker'), scale: 3, tag: 'Common', caption: 'The town\'s main residents. They walk.' },
  { id: 'runner', title: 'Runner', sprite: zombieFront(art, 'runner'), scale: 3, tag: 'Brisk', caption: 'As described.' },
  { id: 'bloater', title: 'Bloater', sprite: zombieFront(art, 'bloater'), scale: 2.6, tag: 'Pops', caption: 'Bursts. Admire from a distance.' },
  { id: 'brute', title: 'Brute', sprite: zombieFront(art, 'brute'), scale: 2, tag: 'Large', caption: 'A disappointing thing to shove.' },
  { id: 'screamer', title: 'Screamer', sprite: zombieFront(art, 'screamer'), scale: 3, tag: 'Loud', caption: 'If it sees you, everyone hears about it.' },
];

const survivors: CardList = (art) =>
  ['Night', 'Khronus8', 'Satori', 'Rex', 'Sol'].map((name, index) => ({
    id: name.toLowerCase(),
    title: name,
    sprite: art.survivors[index].portrait,
    scale: 3.4,
    tag: `Visa ${index + 1}`,
  }));

const noise: CardList = (art) => [
  { id: 'gunshot', title: 'Gunshot', sprite: art.ui.weaponIcons.pistol, scale: 1.6, tag: 'Loud', caption: 'Carries.' },
  { id: 'search', title: 'Searching', sprite: art.containers.box.closed, scale: 0.8, tag: 'Maybe', caption: 'Depends on your luck.' },
  { id: 'shove', title: 'Shove', sprite: art.ui.pickupIcons.knife, scale: 2, tag: 'Silent', caption: 'Rude, but quiet.' },
];

const difficulty: CardList = (art) =>
  ['Mild', 'Fair', 'Stormy', 'Do not travel'].map((tag, index) => {
    const friendly = index < 2;
    return { id: `outlook-${index}`, title: tag, sprite: friendly ? art.ui.heart : art.ui.skull, scale: 3 };
  });

const rounds: CardList = (art) => [
  { id: 'incendiary', title: 'Flame rounds', sprite: art.ui.pickupIcons.incendiary_kit, scale: 3, tag: 'Hot', caption: 'Loud, bright and very sorry.' },
  { id: 'acid', title: 'Acid rounds', sprite: art.ui.pickupIcons.acid_kit, scale: 3, tag: 'Sour', caption: 'Brutes take it personally.' },
  { id: 'piercing', title: 'Piercing rounds', sprite: art.ui.pickupIcons.piercing_kit, scale: 3, tag: 'Sharp', caption: 'Two for the price of one.' },
  { id: 'tranq', title: 'Tranq rounds', sprite: art.ui.pickupIcons.tranq_kit, scale: 3, tag: 'Calm', caption: 'Slower, if not quite sorry.' },
];

const SECTION_CARDS: Readonly<Record<string, CardList>> = {
  supplies,
  searching,
  hordes,
  survivors,
  noise,
  difficulty,
  goal: (art) => [{ id: 'van', title: 'Escape van', sprite: art.environment.escapeVan, scale: 1 }],
  controls: (art) => [{ id: 'crosshair', title: 'Crosshair', sprite: art.ui.crosshair, scale: 2 }],
  melee: (art) => [{ id: 'knife', title: 'Knife', sprite: art.ui.pickupIcons.knife, scale: 2 }],
  van: (art) => [{ id: 'van', title: 'Escape van', sprite: art.environment.escapeVan, scale: 1 }],
  workbench: (art) => [{ id: 'toolkit', title: 'Toolkit', sprite: art.ui.pickupIcons.toolkit, scale: 2 }],
  rounds,
  coop: (art) => [{ id: 'team', title: 'Night', sprite: art.survivors[0].portrait, scale: 1 }],
};

/** The pictures for a section. A section with none of its own yet returns an empty list. */
export function getSectionVisuals(sectionId: string, art: ArtBook): readonly GalleryCard[] {
  return SECTION_CARDS[sectionId]?.(art) ?? [];
}

/** The crosshair and the crosshair over a head, side by side. */
export const crosshairCards: CardList = (art) => [
  { id: 'crosshair', title: 'Not a head', sprite: art.ui.crosshair, scale: 3.5 },
  { id: 'crosshair-head', title: 'A head', sprite: art.ui.crosshairHead, scale: 3.5 },
];
