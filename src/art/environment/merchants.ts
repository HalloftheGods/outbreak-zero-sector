// The four merchants. Placeholders for the merchants lane: a coat and a head, and a portrait to match.

import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId } from '../../../shared/home-protocol.ts';
import { PROP_DEFS } from '../../../shared/protocol.ts';
import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import type { MerchantArt, PixelSprite } from '../types.ts';
import { bake } from './common.ts';

const { bone, fire, metal, olive, skin } = RAMPS;

const COAT: Record<MerchantId, Color> = { gunsmith: metal[2], quartermaster: olive[2], medic: bone[2], powder: fire[1] };

const FIGURE_MARGIN = 2;
const FIGURE_HEIGHT = 26;
const PORTRAIT_SIZE = 32;

function figure(id: MerchantId): PixelSprite {
  const { w } = PROP_DEFS[id];
  const ground = FIGURE_HEIGHT - FIGURE_MARGIN;
  const canvas = new PixelCanvas(w + FIGURE_MARGIN * 2, FIGURE_HEIGHT);
  canvas.rect(FIGURE_MARGIN + 1, 8, w - 2, ground - 8, COAT[id]);
  canvas.rect(FIGURE_MARGIN + 3, 2, w - 6, 6, skin[2]);
  return bake(canvas.outline(), FIGURE_MARGIN, w, ground);
}

function portrait(id: MerchantId): PixelSprite {
  const canvas = new PixelCanvas(PORTRAIT_SIZE, PORTRAIT_SIZE);
  canvas.rect(6, 20, 20, 11, COAT[id]);
  canvas.rect(10, 6, 12, 14, skin[2]);
  return canvas.outline().toSprite();
}

const eachMerchant = <T>(build: (id: MerchantId) => T): Record<MerchantId, T> =>
  Object.fromEntries(MERCHANT_IDS.map((id) => [id, build(id)])) as Record<MerchantId, T>;

export function buildMerchantProps(): Record<MerchantId, PixelSprite> {
  return eachMerchant(figure);
}

export function buildMerchants(): Record<MerchantId, MerchantArt> {
  return eachMerchant((id) => ({ figure: figure(id), portrait: portrait(id) }));
}
