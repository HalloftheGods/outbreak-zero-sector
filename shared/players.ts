import { characterOf } from './characters.ts';
import { PLAYER_RADIUS, PLAYER_SPEED, TICK_DT } from './constants.ts';
import { stopSearch, updateSearch } from './container-search.ts';
import { updateMelee } from './melee.ts';
import { stepMovement } from './movement.ts';
import { useMedkit } from './player-health.ts';
import type { ClientInputPacket } from './protocol.ts';
import type { PlayerState, SimState } from './sim-state.ts';
import { updateWeapons } from './weapons.ts';
import { buildingAt } from './world-query.ts';

const FULL_TURN = Math.PI * 2;

/** Shared with the client, whose prediction has to walk at the speed the sim does. */
export function playerSpeed(skin: number): number {
  return PLAYER_SPEED * characterOf(skin).moveSpeed;
}

/** Stores the newest input. One-shot requests latch until a tick consumes them. */
export function receiveInput(p: PlayerState, input: ClientInputPacket): void {
  const validSeq = Number.isFinite(input.seq);
  if (validSeq && input.seq < p.queuedSeq) return;
  if (validSeq) p.queuedSeq = input.seq;

  p.up = input.up === true;
  p.down = input.down === true;
  p.left = input.left === true;
  p.right = input.right === true;
  p.shoot = input.shoot === true;
  if (p.shoot) p.shootQueued = true;
  // Wrapped so a finite but absurd value cannot overflow when snapshots round it.
  if (Number.isFinite(input.angle)) p.angle = input.angle % FULL_TURN;
  const { aimX, aimY } = input;
  const aimed = Number.isFinite(aimX) && Number.isFinite(aimY);
  if (aimed) p.aim = { x: aimX as number, y: aimY as number };
  p.touchAim = input.touch === true;
  if (input.reload === true) p.reloadQueued = true;
  if (input.melee === true) p.meleeQueued = true;
  if (input.heal === true) p.healQueued = true;
  p.searchHeld = input.search === true;
  if (input.weapon) p.weaponQueued = input.weapon;
}

/** Applies the stored input exactly once, so speed never depends on packet rate. */
export function updatePlayer(sim: SimState, p: PlayerState): void {
  p.lastInputSeq = p.queuedSeq;
  if (p.status !== 'alive') {
    p.moving = false;
    p.reloadQueued = false;
    p.weaponQueued = null;
    p.meleeQueued = false;
    p.healQueued = false;
    p.shootQueued = false;
    stopSearch(p);
    return;
  }
  const dirX = Number(p.right) - Number(p.left);
  const dirY = Number(p.down) - Number(p.up);
  p.moving = dirX !== 0 || dirY !== 0;
  if (p.moving) {
    const moved = stepMovement(sim.map, p.x, p.y, dirX, dirY, playerSpeed(p.skin), TICK_DT, PLAYER_RADIUS);
    p.x = moved.x;
    p.y = moved.y;
  }
  p.indoors = buildingAt(sim.map, p.x, p.y)?.id ?? null;
  updateWeapons(sim, p);
  updateMelee(sim, p);
  useMedkit(sim, p);
  updateSearch(sim, p);
}
