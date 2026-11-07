// The four merchants: a figure behind each stall, a portrait for the How to Play book and a bust for
// the shop screen. The figure and portrait are drawn on the survivor rig (merchant-people/), so the
// merchants share the playable cast's build, outline, palette and lighting.

import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId } from '../../../shared/home-protocol.ts';
import type { MerchantArt, PixelSprite } from '../types.ts';
import type { BustDef } from '../survivors/bust.ts';
import { bustOf } from '../survivors/bust.ts';
import { standingFrame } from '../survivors/fallen.ts';
import { portraitOf } from '../survivors/portrait.ts';
import type { Person } from '../survivors/rig.ts';
import { GUNSMITH_BUST } from './merchant-busts/gunsmith.ts';
import { MEDIC_BUST } from './merchant-busts/medic.ts';
import { POWDER_BUST } from './merchant-busts/powder.ts';
import { QUARTERMASTER_BUST } from './merchant-busts/quartermaster.ts';
import { GUNSMITH } from './merchant-people/gunsmith.ts';
import { MEDIC } from './merchant-people/medic.ts';
import { POWDER } from './merchant-people/powder.ts';
import { QUARTERMASTER } from './merchant-people/quartermaster.ts';

const PEOPLE: Record<MerchantId, Person> = {
  gunsmith: GUNSMITH,
  quartermaster: QUARTERMASTER,
  medic: MEDIC,
  powder: POWDER,
};

/** Standing behind the stall: the survivor rig's front pose, hands at the sides, feet on the anchor. */
const figure = (id: MerchantId): PixelSprite => standingFrame(PEOPLE[id], 0, 'stand', 0, 0, 0);

/** The same crop the survivors' portraits use, so a merchant stands at their scale in the book. */
const portrait = (id: MerchantId): PixelSprite => portraitOf(PEOPLE[id]);

const eachMerchant = <T>(build: (id: MerchantId) => T): Record<MerchantId, T> =>
  Object.fromEntries(MERCHANT_IDS.map((id) => [id, build(id)])) as Record<MerchantId, T>;

export function buildMerchantProps(): Record<MerchantId, PixelSprite> {
  return eachMerchant(figure);
}

const BUSTS: Record<MerchantId, BustDef> = {
  gunsmith: GUNSMITH_BUST,
  quartermaster: QUARTERMASTER_BUST,
  medic: MEDIC_BUST,
  powder: POWDER_BUST,
};

export function buildMerchants(): Record<MerchantId, MerchantArt> {
  return eachMerchant((id) => ({ figure: figure(id), portrait: portrait(id), bust: bustOf(BUSTS[id]) }));
}
