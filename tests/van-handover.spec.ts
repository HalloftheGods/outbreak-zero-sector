import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../shared/constants.ts';
import { emptyLoadout, validateLoadout } from '../shared/loadout.ts';
import { armedHands } from '../src/game/home/gear-pool.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { fitted, lockerGuns } from './helpers/home-sync-frames.ts';

describe('the gun the van hands over', () => {
  const withLocker = (locker: Partial<HomeSave['locker']>, hands = emptyLoadout()) => ({ ...emptySave(7), hands, locker: { ...emptyLoadout(), ...locker } });

  it('is nothing with a gun in hand or none in the locker', () => {
    expect(armedHands(withLocker({}))).toBeNull();
    expect(armedHands(withLocker(lockerGuns, { ...emptyLoadout(), guns: { pistol: {} } }))).toBeNull();
  });

  it('is the last of the guns that have rounds', () => {
    expect(Object.keys(armedHands(withLocker(lockerGuns))?.guns ?? {})).toEqual(['carbine']);
  });

  it('a gun with rounds beats one without, however modded', () => {
    const save = withLocker({ guns: { pistol: {}, shotgun: { fit: fitted } }, ammoBag: { pistol: 5, carbine: 0, shotgun: 0 } });
    expect(Object.keys(armedHands(save)?.guns ?? {})).toEqual(['pistol']);
  });

  it('a modded gun beats a plain one', () => {
    const save = withLocker({ guns: { pistol: { fit: fitted }, shotgun: {} }, ammoBag: { pistol: 5, carbine: 0, shotgun: 5 } });
    expect(Object.keys(armedHands(save)?.guns ?? {})).toEqual(['pistol']);
  });

  it('with no rounds anywhere, a gun is still a gun', () => {
    expect(Object.keys(armedHands(withLocker({ guns: { shotgun: {} } }))?.guns ?? {})).toEqual(['shotgun']);
  });

  it('keeps what the hands hold, and rounds stop at the reserve cap', () => {
    const cap = WEAPONS.pistol.reserveCap;
    const hands = { ...emptyLoadout(), medkits: 2, ammoBag: { pistol: cap - 1, carbine: 0, shotgun: 0 } };
    const gear = armedHands(withLocker({ guns: { pistol: {} }, ammoBag: { pistol: 5, carbine: 0, shotgun: 0 } }, hands));
    expect(gear?.medkits).toBe(2);
    expect(gear?.ammoBag.pistol).toBe(cap);
    expect(validateLoadout(gear)).not.toBeNull();
  });
});
