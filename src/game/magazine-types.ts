import type { PixelSprite } from '../art/types.ts';

/** The shape of How to Play's printed magazine. magazine-pages.ts builds it; the components only lay it out. */
export type MagazineColor = 'tomato' | 'teal' | 'mustard' | 'violet' | 'pink' | 'sky' | 'lime';

export type ChapterLayout =
  | 'column'
  | 'feature'
  | 'keys'
  | 'rings'
  | 'catalog'
  | 'classifieds'
  | 'hero'
  | 'wildlife'
  | 'panorama'
  | 'diagram'
  | 'roster'
  | 'forecast'
  | 'postcard';

export type PageLayout = ChapterLayout | 'cover' | 'contents' | 'letter';

export type GalleryStyle = 'catalog' | 'classifieds' | 'spotter' | 'passport' | 'forecast' | 'meter' | 'pair';

/** Marker pen on a photo, in the photo's own pixels. */
export type PhotoMark =
  | { readonly kind: 'circle'; readonly x: number; readonly y: number; readonly r: number }
  | { readonly kind: 'arrow'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
  | { readonly kind: 'note'; readonly x: number; readonly y: number; readonly text: string };

export interface GalleryCard {
  readonly id: string;
  readonly title: string;
  readonly sprite: PixelSprite;
  readonly scale: number;
  readonly caption?: string;
  readonly tag?: string;
  /** One of the section's own points, word for word, when the card carries it. */
  readonly point?: string;
}

export interface DiagramPart {
  readonly id: string;
  readonly title: string;
  readonly sprite: PixelSprite;
}

export interface ItineraryStop {
  readonly level: number;
  readonly sprite: PixelSprite;
}

export interface ChapterLink {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly kicker: string;
  readonly color: MagazineColor;
  readonly page: number;
  /** Where in the magazine's page list the chapter opens. */
  readonly pageIndex: number;
}

export interface CoverLine extends ChapterLink {
  readonly line: string;
}

/** Whatever a layout hint can drop on a page. `extra` blocks go first when a page runs out of room. */
export type MagazineBlock = { readonly extra?: boolean } & (
  | { readonly kind: 'head'; readonly number: number; readonly kicker: string; readonly title: string; readonly deck: string }
  | { readonly kind: 'article'; readonly heading?: string; readonly style: ArticleStyle; readonly points: readonly string[] }
  | { readonly kind: 'photo'; readonly sprite: PixelSprite; readonly caption: string; readonly tilt: number; readonly marks: readonly PhotoMark[]; readonly size: PhotoSize }
  | { readonly kind: 'sticky'; readonly text: string; readonly tilt: number }
  | { readonly kind: 'tip'; readonly text: string }
  | { readonly kind: 'stamp'; readonly text: string; readonly tilt: number }
  | { readonly kind: 'sidebar'; readonly title: string; readonly lines: readonly (readonly [term: string, meaning: string])[] }
  | { readonly kind: 'gallery'; readonly style: GalleryStyle; readonly title?: string; readonly cards: readonly GalleryCard[] }
  | { readonly kind: 'keyboard'; readonly caption: string }
  | { readonly kind: 'diagram'; readonly gun: PixelSprite; readonly parts: readonly DiagramPart[]; readonly caption: string }
  | { readonly kind: 'hero'; readonly sprite: PixelSprite; readonly burst: string; readonly caption: string }
  | { readonly kind: 'review'; readonly stars: number; readonly quote: string }
  | { readonly kind: 'letter'; readonly title: string; readonly paragraphs: readonly string[]; readonly signed: string }
  | { readonly kind: 'itinerary'; readonly title: string; readonly stops: readonly ItineraryStop[] }
  | { readonly kind: 'contents'; readonly chapters: readonly ChapterLink[] }
  | { readonly kind: 'cover'; readonly art: PixelSprite; readonly logo: PixelSprite; readonly lines: readonly CoverLine[] }
);

export type ArticleStyle = 'numbered' | 'bullets' | 'keys' | 'plain';
export type PhotoSize = 'hero' | 'normal' | 'small';

export type PageSide = 'left' | 'right' | 'wide';

export interface MagazinePage {
  readonly id: string;
  /** The folio printed in the corner. Null on the cover. */
  readonly folio: number | null;
  readonly side: PageSide;
  readonly color: MagazineColor;
  readonly layout: PageLayout;
  readonly runningHead: string;
  readonly blocks: readonly MagazineBlock[];
  /** A picture running across the whole spread, this page showing its half. */
  readonly backdrop?: PixelSprite;
}

export interface MagazineSpread {
  readonly pages: readonly MagazinePage[];
  /** Index of its first page in the magazine's page list. */
  readonly firstPage: number;
}

export interface Magazine {
  readonly spreads: readonly MagazineSpread[];
  readonly pages: readonly MagazinePage[];
  readonly chapters: readonly ChapterLink[];
}
