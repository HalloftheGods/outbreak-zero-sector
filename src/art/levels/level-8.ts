// Frozen Wasteland: a blizzard dusk over a buried town. A pale sun sits low on the horizon and the
// frosted dead lurch out of its glare, one of them black against the disc. A survivor in an orange
// scarf trudges toward them, boot holes trailing back past a bare dead tree; a rusted car lies
// drifted over up to its iced windows, bottom right. Ice-blue snow, denim sky.
//
// Lit by the sun from behind the horizon: warm bone crests on the drifts (W, Z where they face it), cool
// metal snow elsewhere (L), denim shadow pooled under each drift (V, N). K is the silhouettes.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, bone, brick, denim, fire, ink, metal, wood } = RAMPS;

export const LEVEL_8_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], N: denim[1], V: denim[2],
    M: metal[1], l: metal[2], L: metal[3],
    a: ash[0], A: ash[1],
    Z: bone[2], W: bone[3],
    q: brick[0], r: brick[1], R: brick[2],
    e: wood[2], o: fire[1],
  },
  rows: [
    'nnnnnnnnnnnnnnnnnnnnnnnnnnnnLnnnnnnnnnnnnnnnnnnnnnnnLnnn',
    'nnnnnnnLnnnnnnnnnnnnnnnnnnnnnnnLnnnnnnnnnnnnnnnnnnnnnnnn',
    'nnNNLNlnnnLnnnnnnnnnnnnnnnnnnnlnNNNNnnnnnnLnnnnnnnnnnnnn',
    'NNNNKNNNnKnnnLnnnnnnnLnnnnnnnNNNNNNNNNnnnnnnnnnnnnnnnnnn',
    'LNLNKLNNNKnnLKnnnNNNlnnnnnNNNNNNNNNNNNNNnnnnnNNNNnnnnnnn',
    'NNKNLKNNNKLLKLLNNNNNNNNNNNNNNNNNNNNLNNNNNNNNNNNNNNNNNNNN',
    'NNNKKKLNNNKNKKKNNNNNNNNNNNNNNNNNNNlNllllVVVVVVLVVVVVVNNN',
    'NNNNNKKNVVKKKVVVVVVVVVNNNLNNNNNNNlllllllllllllllNLNNNNNN',
    'NNNNLNKNNNKKNNNNNNNNNNNNlNNNLNllllllllllllllllllllNNNNNN',
    'NNNNNNKLNNKNNNNNNVVVVVVVVNNNVlllllllllLLLlLlllllllVVNNNN',
    'VVLVVVNKNLKNNNVVVKLVVVVVVVlllllllllLlLLLLLlLllllllllVVVV',
    'llKllllKLKVVVVVVKVVVVVVVVllllLllLlLLLLLLLLLLLllllllllLVV',
    'VVKVVVVKKKVVVLVKVVVVVVVVllllllllLLLLLLLLLLLLLLllllllllVV',
    'VVKLVVVKKVVLLKKVVVVVVVVVllllllLlLLLLLZWWWZLLLLlllllllllV',
    'VKLKVVVKKVlLKKLVllllVVLVlllllLlLLLLLZWWWWWZLLLLLllllllll',
    'KLKKVVVKKLLKVlKKlllllVVlllllllLLLLLZWWAaWWWZLLLlllllllll',
    'VKKKLLLKKKKllllllllllllllllllLAaLLLZWWaaaWWZLLAallllllll',
    'LLLKKlKLKlLLLllLllllllllllllllaaaLLZWaaaaWWZLLaaalllllll',
    'llllKlKKlllllLllllllllllllLlLaaaaALLLLLaaLLLLaaaalLlAlll',
    'lllLlKKKllllllLLLLLllllllllllLLaaaaLLZWaaZLLLLLaallaalll',
    'lllKLlKKllllllMkMMkMLKKZLLLLLLlalalLLLLaLaLLLLlalallalll',
    'llllKlKKlllllWWWWWWWKKKKZlllllllllallllllllllllllllallll',
    'lLLLlKKKMlLLLlLLLllLKKKkWLllLLLlLLLllLLLlLLLllLLLlLLLllL',
    'LLLLLWKKMLLLLLLLLLoooKKKZLLLLLLLLLLLLLLLWWWWWWWWWWWLLLLL',
    'LLLLLKKKMLLLLLLLLooLoKKKKZWWZZZLLLLLLLWWLLLLLLLLLLLWWLLL',
    'WWWWWKKKMLLLLLLWWWWWeeKKKMZVVVVLLLLLLkRRRRRRRRRRRRRRRRkL',
    'VVLVVKKKMWWWWWWVVVVVeeKKKKZLLLLLLLLLkrLrrrrrLrrrrLrrrLrk',
    'LLLLLKKKMVVVVVVLLLLLeeKKKKMLLLLLLLLkrLVnnkrrnnVnnkrrnVnr',
    'LLLLLKKKMLLLLLLLLLLLLKKKKLLLLLLLLLkrlVLnnkrrnVLnLkrrnVLr',
    'LLLLLKKKMLLLLLLLLLLLLKKKMLLLLLLLLkrnnVnnnkrrnnVnnkrrnnVr',
    'LLLLLKKKMLLLLLLLLLLLKKLLKMLLLLLLkRRRRRRRRRRRRRRRRRRRRRRR',
    'LLLWWWWWWWLLLLLLLLLLKKLLLKMLLLLkrrrrrrrrrrrWWWWWWWrrrrrr',
    'LWWLLLLLLLWWLLLLLLLKKLLLLKKLLLWWrrrqrrrrWWWLLLLLLLWWWrrq',
    'WLLLLLLLLLlVWLlVWLWWWWLLWWWWLLLLWWWWWWWWLLLLLLLLLLLLLWWW',
    'LLLLLLLLlVWLlVWLlVWLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLWWWWWWWWWWWWLLLLLVVVVVVVVVVVVVVVVVVLVVVVVVV',
    'LLLLLLWWWWWWWVVVVVVVVVVVVWLLLLLLLLLVVVVVVVVVVVVVVVVVVVVV',
    'WWWWWWVVVVVVVLLLLLLLLLLLLVLLLLLLVVVVVVLVVVVNNNNNNNNNNNNN',
    'VVVVVVLLLLLLLLLLLLLLLLLLLLLLLVVVVVVVVVVNNNNNNNNNNNNNNNNN',
  ],
};
