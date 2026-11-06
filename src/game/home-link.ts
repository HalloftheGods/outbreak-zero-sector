// The client's end of the home loop: opens the save, brings the room its gear, and turns what comes
// back into screens. Every write to the save is HomeSync's. This decides what the player sees and holds.

import { BASELINE_DIFFICULTY } from '../../shared/difficulty.ts';
import type { DifficultyId } from '../../shared/difficulty.ts';
import { isBunkerSeed } from '../../shared/home-protocol.ts';
import type { HomeAction, JoinHome, Loadout, MerchantId, StationId, TripReceipt } from '../../shared/home-protocol.ts';
import { emptyLoadout } from '../../shared/loadout.ts';
import type { PlayerEntity, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import type { GameTransport, TransportKind } from '../network/transport.ts';
import { shopContext } from './home-hud.ts';
import type { HomeActions, HomeDeath, HomeFacts } from './home-hud.ts';
import type { HomeStore } from './home/home-store.ts';
import { HomeSync, joinHomeFor } from './home/home-sync.ts';
import type { Banner, RunResult, UiState } from './hud-state.ts';
import { loadLevelProgress, recordGameFinished, recordLevelCleared } from './level-progress.ts';
import { endingResult, recordTrip } from './trip-record.ts';

/** A banner lasts this long, so a question still waiting is put again after it. */
const ASK_AGAIN_MS = 2600;

const VAN_HINT: Omit<Banner, 'key'> = { title: 'THE VAN IS IN THE GARAGE', subtitle: 'PICK A LEVEL AT THE MAP, THEN STAND IN THE RING', tone: 'hope' };
const NO_GUN_ASK: Omit<Banner, 'key'> = { title: 'NO GUN IN HAND', subtitle: 'ONE WAITS IN THE LOCKER. PRESS ENTER TO GO WITHOUT', tone: 'danger' };

/** The parts of the controller a home session reaches into. */
export interface HomeLinkHost {
  transport(): GameTransport | null;
  ui(): UiState;
  localPlayer(): PlayerEntity | null;
  /** The save, an error, a death or the ending moved, and the screens should hear of it now. */
  refresh(): void;
  /** Whether the player's hands are free may have changed. */
  syncControls(): void;
  say(banner: Omit<Banner, 'key'>, nowMs: number): void;
  showEnding(result: RunResult): void;
  hideEnding(): void;
}

export interface HomeLinkOptions {
  /** The game is played from the bunker. */
  readonly enabled: boolean;
  readonly store: () => HomeStore;
  readonly host: HomeLinkHost;
}

export class HomeLink {
  readonly enabled: boolean;
  /** What the screens can ask for. */
  readonly actions: HomeActions;

  private readonly createStore: () => HomeStore;
  private readonly host: HomeLinkHost;
  private sync: HomeSync | null = null;
  private highest = loadLevelProgress().highest;
  private difficulty: DifficultyId = BASELINE_DIFFICULTY;
  /** The station this player has open. */
  private station: StationId | null = null;
  private death: HomeDeath | null = null;
  private ending = false;
  /** The gear this trip took out, which a death takes with it. */
  private takenOut: Loadout = emptyLoadout();
  private greeted = false;
  /** A word that the player is boarding with no gun, held back until they say they mean it. */
  private heldReady: HomeAction | null = null;
  private askedAtMs = Number.NEGATIVE_INFINITY;

  constructor({ enabled, store, host }: HomeLinkOptions) {
    this.enabled = enabled;
    this.createStore = store;
    this.host = host;
    this.actions = {
      pickLevel: (level) => this.send({ kind: 'pick_level', level }),
      equip: (loadout) => this.sync?.equip(loadout),
      closeStation: () => void this.closeOpenStation(),
      // The forge runs by itself for as long as the player stays at it.
      smelt: () => {},
      buy: (merchant, item) => this.buy(merchant, item),
      wake: () => this.wake(),
      continueFromEnding: () => this.continueFromEnding(),
    };
  }

  /** What the screens know that no snapshot carries. */
  facts(): HomeFacts {
    const { sync } = this;
    return {
      save: sync?.save ?? null,
      highest: this.highest,
      difficulty: this.difficulty,
      forgeProgress: sync?.forgeProgress ?? 0,
      saveError: sync?.saveError ?? null,
      death: this.death,
    };
  }

  /** A station, the death summary or the ending is up, and the keys are theirs. */
  get holdsControls(): boolean {
    return this.station !== null || this.death !== null || this.ending;
  }

  get endingShowing(): boolean {
    return this.ending;
  }

  /** Reads the save and settles what can be settled, then says what to bring to the room. */
  async open(kind: TransportKind): Promise<JoinHome> {
    this.close();
    const sync = new HomeSync({
      store: this.createStore(),
      mode: kind,
      sendHome: (action) => this.send(action),
      onChange: () => this.host.refresh(),
      onReceipt: (receipt) => this.onReceipt(receipt),
    });
    this.sync = sync;
    const save = await sync.open();
    const progress = loadLevelProgress();
    const stillCurrent = this.sync === sync;
    if (stillCurrent) this.highest = progress.highest;
    return joinHomeFor(save, progress);
  }

  welcomed(packet: WelcomePacket): void {
    this.difficulty = packet.difficulty ?? BASELINE_DIFFICULTY;
    this.sync?.welcomed(packet);
  }

  /** Called with every snapshot, once the run has a world. */
  observe(snapshot: SnapshotPacket, localId: string, nowMs: number): void {
    const { sync } = this;
    if (!sync) return;
    const entity = snapshot.players.find((player) => player.id === localId);
    const trip = sync.save?.openTrip ?? null;
    if (trip) this.takenOut = sync.save?.hands ?? this.takenOut;
    sync.observe(snapshot, localId);
    this.watchStation(entity?.home?.station ?? null);
    this.greet(snapshot, nowMs);
    this.askAgain(nowMs);
  }

  /** Esc and the Close button: the room puts the station away, and the next snapshot says so. True if one was open. */
  closeOpenStation(): boolean {
    const nothingOpen = this.station === null;
    if (nothingOpen) return false;
    this.send({ kind: 'leave_station' });
    return true;
  }

  /** Enter: reads the death summary, or means it about boarding without a gun. True if it did something. */
  confirm(): boolean {
    if (this.death) {
      this.wake();
      return true;
    }
    const held = this.heldReady;
    if (!held) return false;
    this.heldReady = null;
    this.host.transport()?.sendHome(held);
    return true;
  }

  /** The run is over, or this session was never going to start. */
  close(): void {
    this.sync?.close();
    this.sync = null;
    this.station = null;
    this.death = null;
    this.ending = false;
    this.takenOut = emptyLoadout();
    this.greeted = false;
    this.heldReady = null;
  }

  private send(action: HomeAction): void {
    const isReadyWord = action.kind === 'ready';
    if (isReadyWord) this.heldReady = null;
    if (this.mustAsk(action)) {
      this.heldReady = action;
      this.askedAtMs = Number.NEGATIVE_INFINITY;
      return;
    }
    this.host.transport()?.sendHome(action);
  }

  /** Boarding with no gun in hand, while one waits in the locker, is a choice the room cannot make for them. */
  private mustAsk(action: HomeAction): boolean {
    const boardingForGood = action.kind === 'ready' && action.ready && action.ownsGun === true;
    const handsHoldAGun = Object.keys(this.sync?.save?.hands.guns ?? {}).length > 0;
    return boardingForGood && !handsHoldAGun;
  }

  private askAgain(nowMs: number): void {
    const waiting = this.heldReady !== null && nowMs - this.askedAtMs >= ASK_AGAIN_MS;
    if (!waiting) return;
    this.askedAtMs = nowMs;
    this.host.say(NO_GUN_ASK, nowMs);
  }

  private watchStation(station: StationId | null): void {
    const changed = station !== this.station;
    this.station = station;
    if (changed) this.host.syncControls();
  }

  /** A new player is told once where the van is. Anyone who has made a trip knows. */
  private greet(snapshot: SnapshotPacket, nowMs: number): void {
    const save = this.sync?.save ?? null;
    const firstLook = !this.greeted && save !== null && isBunkerSeed(snapshot.mapSeed);
    if (!firstLook) return;
    this.greeted = true;
    const newHere = save.ledger.length === 0;
    if (newHere) this.host.say(VAN_HINT, nowMs);
  }

  /** Credited here, once. */
  private onReceipt(receipt: TripReceipt): void {
    const isNewBest = recordTrip(receipt, this.host.ui().callsign);
    const died = receipt.outcome === 'died';
    if (died) this.die(receipt);
    else this.bank(receipt, isNewBest);
    this.host.refresh();
  }

  private die(receipt: TripReceipt): void {
    this.death = { receipt, lost: this.takenOut };
    this.takenOut = emptyLoadout();
    this.host.syncControls();
  }

  /** Reaching the van opens the next level, and the first clear of the last one plays the ending. */
  private bank(receipt: TripReceipt, isNewBest: boolean): void {
    this.highest = recordLevelCleared(receipt.level).highest;
    this.takenOut = emptyLoadout();
    if (!receipt.ending) return;
    recordGameFinished();
    const me = this.host.localPlayer();
    const survivor = { id: me?.id ?? '', name: me?.name ?? this.host.ui().callsign, skin: me?.skin ?? 0 };
    this.ending = true;
    this.host.showEnding(endingResult(receipt, survivor, isNewBest));
    this.host.syncControls();
  }

  private wake(): void {
    if (!this.death) return;
    this.death = null;
    this.host.syncControls();
    this.host.refresh();
  }

  /** The credits are over: back to the bunker, in the same session. */
  private continueFromEnding(): void {
    if (!this.ending) return;
    this.ending = false;
    this.host.hideEnding();
    this.host.syncControls();
  }

  private buy(merchant: MerchantId, item: string): void {
    const home = this.host.ui().home;
    const { sync } = this;
    const canSell = sync !== null && home !== null;
    if (!canSell) return;
    void sync.buy(merchant, item, shopContext(home)).then(() => this.host.refresh());
  }
}
