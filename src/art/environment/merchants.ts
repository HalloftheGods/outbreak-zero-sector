// The four merchants: a figure behind each stall and a portrait for the shop screen. Original pixel art, one look per person.

import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId } from '../../../shared/home-protocol.ts';
import { PROP_DEFS } from '../../../shared/protocol.ts';
import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import type { MerchantArt, PixelSprite } from '../types.ts';
import type { BustDef } from '../survivors/bust.ts';
import { bustOf } from '../survivors/bust.ts';
import { bake } from './common.ts';
import { GUNSMITH_BUST } from './merchant-busts/gunsmith.ts';
import { MEDIC_BUST } from './merchant-busts/medic.ts';
import { POWDER_BUST } from './merchant-busts/powder.ts';
import { QUARTERMASTER_BUST } from './merchant-busts/quartermaster.ts';

const { blood, bone, fire, metal, olive, skin, wood, ink } = RAMPS;

type Headgear = 'cap' | 'hair' | 'goggles' | 'hood';
type Mark = 'apron' | 'stripes' | 'cross' | 'scarf';

interface Look {
  coat: Color;
  trim: Color;
  hat: Color;
  headgear: Headgear;
  mark: Mark;
  moustache: boolean;
}

const LOOKS: Record<MerchantId, Look> = {
  gunsmith: { coat: metal[1], trim: wood[2], hat: wood[1], headgear: 'goggles', mark: 'apron', moustache: false },
  quartermaster: { coat: olive[1], trim: olive[2], hat: olive[0], headgear: 'cap', mark: 'stripes', moustache: true },
  medic: { coat: bone[2], trim: blood[2], hat: wood[0], headgear: 'hair', mark: 'cross', moustache: false },
  powder: { coat: fire[0], trim: ink[1], hat: ink[1], headgear: 'hood', mark: 'scarf', moustache: false },
};

/** Where the parts go on a canvas, so the figure and the portrait share one painter. */
interface Frame {
  torso: { x: number; y: number; w: number; h: number };
  head: { x: number; y: number; w: number; h: number };
}

const FIGURE_MARGIN = 2;
const FIGURE_HEIGHT = 26;
const PORTRAIT_SIZE = 32;
const HEAD_HEIGHT = 6;

function paintMark(canvas: PixelCanvas, { x, y, w, h }: Frame['torso'], look: Look): void {
  const middle = x + Math.floor(w / 2);
  if (look.mark === 'apron') canvas.rect(x + 2, y + Math.floor(h / 3), w - 4, h - Math.floor(h / 3), look.trim);
  if (look.mark === 'stripes') {
    canvas.rect(x, y, 2, 2, look.trim);
    canvas.rect(x + w - 2, y, 2, 2, look.trim);
  }
  if (look.mark === 'cross') {
    canvas.rect(middle - 1, y + 1, 2, 4, look.trim);
    canvas.rect(middle - 2, y + 2, 4, 2, look.trim);
  }
  if (look.mark === 'scarf') canvas.rect(x, y, w, 2, look.trim);
}

function paintHead(canvas: PixelCanvas, { x, y, w, h }: Frame['head'], look: Look): void {
  canvas.rect(x, y, w, h, skin[2]);
  const eyeRow = y + Math.floor(h / 2);
  const gap = Math.max(1, Math.floor(w / 3));
  canvas.px(x + gap - 1, eyeRow, ink[0]);
  canvas.px(x + w - gap, eyeRow, ink[0]);
  if (look.moustache) canvas.rect(x + 1, eyeRow + 2, w - 2, 1, wood[1]);
  const { headgear } = look;
  const crown = Math.max(2, Math.floor(h / 4));
  if (headgear === 'hair') canvas.rect(x, y, w, crown, look.hat);
  if (headgear === 'cap') {
    canvas.rect(x, y, w, crown, look.hat);
    canvas.rect(x - 1, y + crown, w + 2, 1, look.hat);
  }
  if (headgear === 'goggles') {
    canvas.rect(x, y, w, crown, look.hat);
    canvas.rect(x, y + crown, w, 1, metal[2]);
    canvas.px(x + gap - 1, y + crown, fire[2]);
    canvas.px(x + w - gap, y + crown, fire[2]);
  }
  if (headgear === 'hood') {
    canvas.rect(x - 1, y - 1, w + 2, crown + 1, look.hat);
    canvas.rect(x - 1, y, 1, h, look.hat);
    canvas.rect(x + w, y, 1, h, look.hat);
    canvas.rect(x + 1, y + h - 2, w - 2, 2, skin[1]);
  }
}

function paint(canvas: PixelCanvas, frame: Frame, look: Look): void {
  const { x, y, w, h } = frame.torso;
  canvas.rect(x, y, w, h, look.coat);
  paintMark(canvas, frame.torso, look);
  paintHead(canvas, frame.head, look);
}

function figure(id: MerchantId): PixelSprite {
  const { w } = PROP_DEFS[id];
  const ground = FIGURE_HEIGHT - FIGURE_MARGIN;
  const canvas = new PixelCanvas(w + FIGURE_MARGIN * 2, FIGURE_HEIGHT);
  const torsoTop = 8;
  paint(
    canvas,
    {
      torso: { x: FIGURE_MARGIN + 1, y: torsoTop, w: w - 2, h: ground - torsoTop },
      head: { x: FIGURE_MARGIN + 3, y: torsoTop - HEAD_HEIGHT, w: w - 6, h: HEAD_HEIGHT },
    },
    LOOKS[id],
  );
  return bake(canvas.outline(), FIGURE_MARGIN, w, ground);
}

function portrait(id: MerchantId): PixelSprite {
  const canvas = new PixelCanvas(PORTRAIT_SIZE, PORTRAIT_SIZE);
  paint(canvas, { torso: { x: 6, y: 20, w: 20, h: 11 }, head: { x: 10, y: 6, w: 12, h: 14 } }, LOOKS[id]);
  return canvas.outline().toSprite();
}

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
