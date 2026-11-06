// Undead Tired: maximum pressure. A hulking rot-green brute leads the charge out of a blood-red
// sky, his head silhouetted on a huge pale moon, jaw dropped over broken fangs and claws thrown
// out at the viewer. Behind him a horde of runners with ember eyes floods the street, the far
// crowd a black mass against the burning horizon, and speed streaks rush out of the vanishing
// point. Lit from the upper left like the survivor busts.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, asphalt, blood, bone, fire, ink, rot } = RAMPS;

export const UNDEAD_TIRED_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    1: blood[0], 2: blood[1], 3: blood[2], 4: blood[3],
    5: fire[0], 6: fire[1], 7: fire[2], 8: fire[3],
    r: rot[0], s: rot[1], t: rot[2], u: rot[3],
    c: bone[1], d: bone[2], e: bone[3],
    a: asphalt[0], A: asphalt[1],
    x: ash[0], X: ash[1],
  },
  rows: [
    '11111111111111111121222222444442222221211111111111111111',
    '11111111111111111222222444448444442222221111111111111111',
    '11111111111111112222224488888888844222222111111111111111',
    '1111111111111212222224888ddd88ddd88422222212111111111111',
    '111111111111212222224888888888ddd88842222221211111111111',
    '1212121212121222222488ddd88888ddd88884222222121712121212',
    '212121212121222222448ddddd888888888884422222217861212121',
    '1212121212122222234888dddkkkkkkk88d888432222226876121212',
    '222222222222222232488888kuuuttttkddd88423222256765222222',
    '22222222222222222448888kuutttt2dskdd88442222256652222222',
    '2222222222222222344888kuutttttt2sskd884432222KKK22222222',
    '32222222KKK222233488ddkutttttttsssk888843322211122222KKK',
    'KKK322221kkk22333448ddktkkttsttkksk88844333221112222kk33',
    '11kk3332ktssk3233448ddkttskkskkrrsk8874433232kkk233ks7k1',
    '1ks7k223k7s7k233334888ktk78ksk87ksk777433332ktsskKkkrrkk',
    'kkrrkkKKksrsk3kk33488kttskkttskkssrk7743kkKKk7s7k1ksxxsk',
    'ksxxskk11krkKks7k3448kutttskkssssrrk744ks7k1ksrsk11kxxk1',
    '3kxxkktkkkskkkrrkk3kkkktkkkkkkkkkrkkk4kkrrkk1krk11kkkkk3',
    '1kkkk1kskxXxksxxkkk333ktkekekekekrk33kkkkxskkkskkksk11kk',
    'kk11kk1kkxXxkkkkuuuk22kskdkkkkkdksk22kuuukkskxXxkkk11kk1',
    'kkkkkkkkkxxxkkuuuttrk2ksk2233322ksk2kuuuuuukkxXxkkkkkkkk',
    'kkkkkkkkkXkxkuutttsrk22kskd222dksk22kuuutttukxxxkkkkkkkk',
    'AAAAAAAkxkAkuuttssrrk22kskekekeksk21kuuttttttkkxkAAAAAAA',
    'AAAAAAAkkAkuuttssrrk222tkssssssrk1111kutttttttkkxkAAAAAA',
    'AAAAAAAAkkuuttssrrk2222ttkkk3kkkr11111kttttttttkkkAAAAAA',
    'AAAAAA4kuuuttssrrk22222tttts3ssrr11111kksttttsssukAAAAAA',
    'AA444kkkktttssrrk222221tttts2ssrr11111kkksssssskkkk444AA',
    '44AAkuuttkksrrrk3222211ktttssssr1k1111kkkkrsskkttttkAA44',
    'AAAkuutttsskrkkk32221111ssssssss111111kkk1kkksstttttkAAA',
    'AAkuttttssrkk11k322221111ttssss1111111kkk111krsstttttkAA',
    'AAktttttssrk111k322221111ttssss111111kkkk111krsstttttkAA',
    'aAktktktsksk1111k22221111ktssssk11111kkkk111kskstktktkaA',
    'AXktktksksrk4111k322211111tsss1111111kkk1111krsksktktk1X',
    '11kekekdkdkk1111k322211111tsss1111111kkk1111kkdkdkekek11',
    '111e1e1d4d111111k322211111tsss1111111kkk111111d4d1e1e111',
    'a1adad4c4ca1a1a1k322211111kss1k111111kkk31a1a1c1c4d1d1a1',
    'aaaaa44aaaaaaaa3k3221111111ss11111111kkk33aaaaaaaa44aaaa',
    'aaaa44aaaaaaaa33k3211111111ss11111111kkka33aaaaaaaa44aaa',
    'aa44aaaaaaaaa33ak311111kkkkkkkkkkkkkkkkkaa33aaaaaaaaa44a',
    'a44aaaaaaaaaa3aak3kkkkkkkkkkkkkkkkkkkkkkaaa3aaaaaaaaaa44',
  ],
};
