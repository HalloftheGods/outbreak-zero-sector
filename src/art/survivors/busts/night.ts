// Night's select portrait in her default Starfield hair, matching her in-game sprite
// (src/art/survivors/night.ts): long navy hair with a blue sheen over the crown, a violet nebula
// across the crown and fringe with a lilac core and a teal glow trailing down to the right, a
// wisp of it down the shaded fall, and stars in two sizes. A violet hoodie with a star on it.
// Shy: her bangs hide one brow, she glances aside and blushes.
//
// Lit from the upper left. Hair is a navy mass n with o strands and an o/X sheen arc over the
// crown. The nebula is violet p rim, q body and r core with a teal j/T glow. A big star is a Y
// cross with X arms, a small one a Y over an X. Hair stays navy where it meets the hoodie. The
// eyes are teal o/y/T. Hoodie is violet t/u/v with a lit hood roll at the neckline, bone
// drawstrings and a bone star. k is the ink outline.
import { RAMPS } from '../../palette.ts';
import type { BustDef } from '../bust.ts';

const { blood, bone, denim, ink, skin, teal, violet } = RAMPS;

export const NIGHT_BUST: BustDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], o: denim[1], X: denim[2], T: teal[1], y: teal[2], Y: bone[3],
    p: violet[0], q: violet[1], r: violet[2], j: teal[0],
    a: skin[0], b: skin[1], c: skin[2], d: skin[3], m: blood[3],
    t: violet[0], u: violet[1], v: violet[2],
    z: bone[3], g: bone[2], f: bone[1], e: bone[0],
  },
  rows: [
    '................................................',
    '................................................',
    '......................kkkk......................',
    '..................kkkknnonkkkk..................',
    '................kkononnnonnnonkk................',
    '..............kknononononnnonnnokk..............',
    '.............kooonooooXXXXXonnnonKk.............',
    '............kononooXXXXXXXXXXXnonnKk............',
    '...........knnnonoXXoonnnnooXXXonnKKk...........',
    '...........knnYooXoppppnnnnooXXXnnKKk...........',
    '..........knnnXoXoppqqqppnnoXYXXXnKKKk..........',
    '.........koonnoXonpqqrqqqppnnXooXnKKnKk.........',
    '.........konnoXookopqrrrqqqqppononKKnKk.........',
    '........knonnnokkbknnpqqrrqqqqqppnonnnKk........',
    '........knonnnkdbbknnnppqqqYqjTjpnonnnKk........',
    '........konnnokddbbknknnppqXjTTjppnnnoKk........',
    '........kXnnnXkdddbbkbknnoppjjTjjpnnnoKk........',
    '.......knXnnnXkddddcbbknkonnnpjjjpnnnoKKk.......',
    '.......knXnnnXkddddnnbbkbknnnonpponnnoKKk.......',
    '.......knXnnnXkdnnnccccbbbknkonnnYnnnoKKk.......',
    '.......kknnnXnkddddccccccbbkbknkkXnnonKkk.......',
    '.......kknnnXnkkkkkkkcccccckkkkkkknnonKkk.......',
    '.......kknnnXnkcKYKKgccccccKYKKfbkpnonKkk.......',
    '.......kknnnXnkcoyTKgccccccoyTKfbkqnonKkk.......',
    '.......kknYnXnkccbbbccccccccbbbbbkqponKkk.......',
    '.......kknXXnnkccccccccccbcccccbbkqpnnKkk.......',
    '.......kknnXnnkcmmccccccbbcccmmbbkqpnnKkk.......',
    '.......kknnXnnkccccccccccccccccbkkqonnKkk.......',
    '.......kknnXnnnkkcccccccccccccbknkqonnKkk.......',
    '.......kknnXnnnknkccccbccbcccbknknponnKkk.......',
    '.......kKkXnnnXkKKkccccaacccckkKknoXnnnKk.......',
    '.......kKkXnnnXkKKKkcccccccbknKKknXYXnknk.......',
    '.......knkXnnnXnkKnKkcccccbkkKKKknoXnKkKk.......',
    '.......kKkXnnnXnknKKkkkkkkkakKKknnonnKkKk.......',
    '.......kKkXnnnXnkKKKkbaaaaaakKKknnonnKkKk.......',
    '.......kKknnnXnnkKKKkcbbbbbakKnknonnnKkKk.......',
    '.......kKnknnXnnnkkkccbbbbbaakkknonnnKknk.......',
    '.......knKknnXnnnkccccbbbbbaaakknonnKknKk.......',
    '.......kKKknnXnnnkccccbbbbbaaakknonnKkkKk.......',
    '.......kkkknXXnnnkttttttttttttkknonnKkukk.......',
    '.....kkvttnXYXnnXkkttttttttttktkonnnKkuutkk.....',
    '....kvvvttknXnnnXkvkgttttttekttkonnnKkuutttk....',
    '...kvvvvttknXnnnXkvvgkkkkkkeuttkonnnKkuuttttk...',
    '..kvvvvvttknXnnnXkvvgvvvuuueuttkonnnKkuutttttk..',
    '..kvvvvvttknXnnnXkuuguuuuuueuutkonnnKkuttttttk..',
    '.kvvvvvuttkXnnnXnkuuguuuuuufuutknnYKkuutttttttk.',
    '.kvvvvuuttkXnnnXnkuuguuuuuuzuuutknXKkuutttttttk.',
    '.kvvvuuututknnnXkuuufuuuuuzzzuutknKkuuutttttttk.',
    '.kvuuuuututknnnXkuuuuuuuzzzzzggutkkuututttttttk.',
    '.kvuuuuutuutknnkuuuuuuuuuzzzzguuukkutuutttttttk.',
    '.kvuuuuutuutknXkuuuuuuuuuuzzguuuuuuutuutttttttk.',
    '.kvuuuuutuuutkkuuuuuuuuuuzzugguuuuutuuutttttttk.',
    '.kvuuuuutuuutukuuuuuuuuuuzuuuguuuuutuuttttttttk.',
    '.kvuuuuutuuuutuuuuuuuuuuuuuuuuuuuutuuuttttttttk.',
    '.kvuuuuutuuuuuuuuuuuuuuuuuuuuuuuuutuuuttttttttk.',
    '.kvuuuuutuuuuuuuuuuuuuuuuuuuuuuuutuuuuttttttttk.',
  ],
};
