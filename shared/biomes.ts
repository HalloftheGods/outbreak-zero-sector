import type { PropKind, TileKind } from './protocol.ts';

/** Props that are plants: a biome's `lush` thickens or thins these and nothing else. */
const PLANTS: ReadonlySet<PropKind> = new Set<PropKind>(['tree', 'bush', 'pine', 'cactus', 'dead_tree', 'scrub', 'reeds', 'fungus']);

/** Plants that only take root on bare dirt, whatever the biome. */
const DRY_PLANTS: ReadonlySet<PropKind> = new Set<PropKind>(['cactus', 'scrub']);

export const isPlant = (kind: PropKind): boolean => PLANTS.has(kind);
export const needsDirt = (kind: PropKind): boolean => DRY_PLANTS.has(kind);

/** Every map is dressed from the same three species slots, which a biome fills with its own. */
export type SpeciesSlot = 'tree' | 'bush' | 'pine';

/**
 * What a town is overgrown with. The map is built the same way everywhere; a biome decides which
 * plants fill the slots, how thick they grow, what the ground is and how much litter the streets carry.
 */
/** How the park is laid out, beyond the cross of dirt paths every park has. */
export type ParkShape = 'cross' | 'ring' | 'pond' | 'clearing' | 'crater';

/** A set piece raised in one corner of the park, built from props the map already has. */
export type LandmarkId = 'plaza' | 'scrapheap' | 'drowned_convoy' | 'sludge_pit' | 'campsite' | 'checkpoint' | 'frozen_convoy' | 'nest' | 'crash_site';

/** Ground laid over the finished town in ragged patches: drifts, flood, ash, sludge. */
export interface Terrain {
  readonly tile: TileKind;
  /** The ground it settles on; anything else, such as floors, is left alone. */
  readonly over: readonly TileKind[];
  readonly count: number;
  /** Patch radius range, in pixels. */
  readonly radius: readonly [number, number];
}

/** A town piece: houses and blocks marked by what has happened to them. */
export interface Affliction {
  readonly count: number;
  /** Stands round the building's walls. */
  readonly ring: PropKind;
  /** Laid under and around it. */
  readonly patch: TileKind;
  readonly litter: PropKind;
}

export interface Biome {
  readonly id: string;
  /** A wall closing a side street, with a gate left in it: a cordon fence or a barricade of wrecks. */
  readonly wall: 'fence' | 'junk' | null;
  readonly afflicted: Affliction | null;
  readonly park: ParkShape;
  /** What a pond or crater in the park is made of. */
  readonly pondTile: TileKind;
  readonly terrain: Terrain | null;
  readonly landmark: LandmarkId | null;
  /** Under the park, the riverside blocks and the verge. */
  readonly ground: TileKind;
  /** Species that stand in for each slot, one picked per placement; a slot left out keeps its own. */
  readonly swap: Readonly<Partial<Record<SpeciesSlot, readonly PropKind[]>>>;
  /** What the park and verge plant in stands, many close together. */
  readonly stand: PropKind;
  /** Scales how many plants are placed. */
  readonly lush: number;
  /** Scales how many wrecks line the roads. */
  readonly wrecks: number;
  /** Scales the rubble on the roads. */
  readonly debris: number;
  /** Plants pushing up through the kerbs of the streets: each kerb tile has this chance of one. */
  readonly creep: { readonly chance: number; readonly kinds: readonly PropKind[] };
  /** Kind, count per 400 tiles of block, and the ground it needs: added to every block on top of its district's own litter. */
  readonly extra: readonly (readonly [PropKind, number, TileKind?])[];
}

const NO_CREEP = { chance: 0, kinds: [] as readonly PropKind[] };

export const TEMPERATE: Biome = {
  id: 'temperate',
  wall: null,
  afflicted: null,
  park: 'cross',
  pondTile: 'water',
  terrain: null,
  landmark: null,
  ground: 'grass',
  swap: {},
  stand: 'pine',
  lush: 1,
  wrecks: 1,
  debris: 1,
  creep: NO_CREEP,
  extra: [],
};

/** One per level, in order: the level a town is built for picks its biome. */
export const BIOMES: readonly Biome[] = [
  // 1 Silent Ruins: the plain town, oaks and a few evergreens.
  TEMPERATE,
  // 2 Escalation: nature taking the streets back, leafy and thick.
  { ...TEMPERATE, id: 'overgrown', park: 'ring', landmark: 'plaza', swap: { pine: ['tree'] }, lush: 1.7, wrecks: 1.2, creep: { chance: 0.05, kinds: ['bush'] } },
  // 3 Into the Breach: a scrapyard district, bare dirt, cactus and dead trees.
  {
    ...TEMPERATE,
    id: 'scrapland',
    landmark: 'scrapheap',
    wall: 'junk',
    ground: 'dirt',
    swap: { tree: ['dead_tree', 'dead_tree', 'tree'], bush: ['scrub'], pine: ['cactus'] },
    stand: 'cactus',
    lush: 0.9,
    wrecks: 1.6,
    debris: 1.5,
    creep: { chance: 0.04, kinds: ['scrub'] },
    extra: [['fire_barrel', 1], ['barrier', 2], ['crate_stack', 2]],
  },
  // 4 Abyssal Depths: a drowned town, reeds and drowned trunks, cars left where the water took them.
  {
    ...TEMPERATE,
    id: 'marsh',
    park: 'pond',
    landmark: 'drowned_convoy',
    afflicted: { count: 5, ring: 'reeds', patch: 'water', litter: 'rubble' },
    terrain: { tile: 'water', over: ['grass', 'dirt', 'asphalt', 'asphalt_cracked'], count: 90, radius: [40, 90] },
    swap: { tree: ['dead_tree', 'tree'], bush: ['reeds', 'reeds', 'bush'], pine: ['reeds'] },
    stand: 'reeds',
    lush: 1.4,
    wrecks: 1.8,
    creep: { chance: 0.05, kinds: ['reeds'] },
  },
  // 5 Contamination Zone: blasted ground and giant fungus.
  {
    ...TEMPERATE,
    id: 'blight',
    park: 'pond',
    pondTile: 'sludge',
    landmark: 'sludge_pit',
    afflicted: { count: 4, ring: 'fire_barrel', patch: 'sludge', litter: 'rubble' },
    terrain: { tile: 'sludge', over: ['grass', 'dirt', 'asphalt', 'asphalt_cracked'], count: 50, radius: [30, 70] },
    ground: 'dirt',
    swap: { tree: ['dead_tree', 'fungus'], bush: ['scrub', 'fungus'], pine: ['fungus'] },
    stand: 'fungus',
    lush: 1.1,
    creep: { chance: 0.03, kinds: ['scrub'] },
  },
  // 6 Blackout: a dark pine forest that has swallowed the town.
  { ...TEMPERATE, id: 'pinewood', park: 'clearing', landmark: 'campsite', swap: { tree: ['pine', 'pine', 'tree'] }, lush: 1.8, wrecks: 0.7, debris: 0.7 },
  // 7 Quarantine Breach: a cordon, bare ground, checkpoints at every turn.
  {
    ...TEMPERATE,
    id: 'cordon',
    landmark: 'checkpoint',
    wall: 'fence',
    ground: 'dirt',
    swap: { tree: ['dead_tree'], bush: ['scrub'], pine: ['dead_tree'] },
    stand: 'dead_tree',
    lush: 0.5,
    wrecks: 1.4,
    debris: 1.2,
    extra: [['barrier', 4], ['sandbags', 4], ['crate_stack', 3], ['fire_barrel', 2]],
  },
  // 8 Frozen Wasteland: tundra, spruce and bare trunks, no leaf anywhere.
  {
    ...TEMPERATE,
    id: 'tundra',
    landmark: 'frozen_convoy',
    afflicted: { count: 5, ring: 'sandbags', patch: 'snow', litter: 'crate_stack' },
    terrain: { tile: 'snow', over: ['grass', 'dirt', 'asphalt', 'asphalt_cracked', 'sidewalk'], count: 140, radius: [40, 100] },
    swap: { tree: ['pine', 'pine', 'dead_tree'], bush: ['scrub'], pine: ['pine'] },
    lush: 1.3,
    wrecks: 1.2,
  },
  // 9 The Hive: fungal growth over everything.
  {
    ...TEMPERATE,
    id: 'hive',
    park: 'clearing',
    pondTile: 'sludge',
    landmark: 'nest',
    afflicted: { count: 5, ring: 'fungus', patch: 'sludge', litter: 'rubble' },
    terrain: { tile: 'sludge', over: ['dirt', 'grass', 'asphalt_cracked'], count: 60, radius: [30, 80] },
    ground: 'dirt',
    swap: { tree: ['fungus', 'dead_tree'], bush: ['fungus', 'scrub'], pine: ['fungus'] },
    stand: 'fungus',
    lush: 1.8,
    creep: { chance: 0.05, kinds: ['scrub'] },
  },
  // 10 Final Stand: ash, charred trunks and burning litter.
  {
    ...TEMPERATE,
    id: 'ashland',
    park: 'crater',
    pondTile: 'ash',
    landmark: 'crash_site',
    afflicted: { count: 4, ring: 'fire_barrel', patch: 'ash', litter: 'rubble' },
    terrain: { tile: 'ash', over: ['grass', 'dirt', 'asphalt', 'asphalt_cracked', 'sidewalk'], count: 130, radius: [40, 100] },
    ground: 'dirt',
    swap: { tree: ['dead_tree'], bush: ['scrub', 'rubble'], pine: ['dead_tree'] },
    stand: 'dead_tree',
    lush: 0.8,
    wrecks: 2,
    debris: 2.2,
    creep: { chance: 0.05, kinds: ['rubble'] },
    extra: [['fire_barrel', 3], ['barrier', 2]],
  },
];

/** The biome of a level's town; a level past either end of the run takes the nearest. */
export function biomeFor(level: number): Biome {
  const index = Math.min(BIOMES.length, Math.max(1, Math.floor(level))) - 1;
  return BIOMES[index];
}
