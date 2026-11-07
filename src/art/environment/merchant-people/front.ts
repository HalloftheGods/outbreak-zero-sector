// Merchants are drawn on the survivor rig (survivors/rig.ts) so they share the cast's build,
// outline and lighting. They only ever face the viewer from behind their stalls, so each one
// is drawn from the front and that drawing stands in for the facings the rig never shows.

import type { Facings, Part } from '../../survivors/rig.ts';

export function facingFront(part: Part): Facings {
  return { 0: part, 1: part, 2: part, 6: part, 7: part };
}
