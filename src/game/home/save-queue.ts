// One save at a time, so a change always sees the save the last one left.

import type { HomeSave, HomeStore, SaveResult } from './home-store.ts';

export type SaveChange = (save: HomeSave) => HomeSave;

const CONFLICT_RETRIES = 3;
const SAVE_RACED = 'Another tab keeps changing the save.';

export interface SaveQueueOptions {
  readonly store: HomeStore;
  /** The save or the error moved. */
  readonly onChange?: () => void;
  /** A save did not land. */
  readonly onFailed?: () => void;
}

export class SaveQueue {
  /** The save as last read, or null until it has loaded. */
  save: HomeSave | null = null;
  /** Why the last save did not land, or null if it did. */
  error: string | null = null;

  private readonly options: SaveQueueOptions;
  private tail: Promise<unknown> = Promise.resolve();

  constructor(options: SaveQueueOptions) {
    this.options = options;
  }

  async load(): Promise<HomeSave> {
    this.save = await this.options.store.load();
    return this.save;
  }

  /** Resolves once every save asked for so far has finished. */
  async settled(): Promise<void> {
    await this.tail;
  }

  /** On a conflict the save is read again and the change made over, up to `retries` times. Pass 0 to stop at the first. */
  write(change: SaveChange, retries = CONFLICT_RETRIES): Promise<SaveResult> {
    const run = this.tail.then(() => this.commit(change, retries)).then((result) => this.warnIfRaced(result, retries));
    this.tail = run;
    return run;
  }

  /** A sale that stops at its first conflict is the shop refreshing, not a fault. */
  private warnIfRaced(result: SaveResult, retries: number): SaveResult {
    const gaveUp = result.kind === 'conflict' && retries > 0;
    if (gaveUp) this.fail(SAVE_RACED);
    return result;
  }

  fail(reason: string): void {
    this.error = reason;
    this.options.onFailed?.();
    this.options.onChange?.();
  }

  private landed(next: HomeSave, version: number): void {
    this.save = { ...next, version };
    this.error = null;
    this.options.onChange?.();
  }

  private async commit(change: SaveChange, retriesLeft: number): Promise<SaveResult> {
    const base = this.save ?? await this.load();
    const next = change(base);
    const unchanged = next === base;
    if (unchanged) return { kind: 'saved', version: base.version };
    const result = await this.options.store.save(next);
    switch (result.kind) {
      case 'saved':
        this.landed(next, result.version);
        return result;
      case 'failed':
        this.fail(result.reason);
        return result;
      case 'conflict':
        return this.afterConflict(change, retriesLeft);
    }
  }

  private async afterConflict(change: SaveChange, retriesLeft: number): Promise<SaveResult> {
    await this.load();
    this.options.onChange?.();
    const mayRetry = retriesLeft > 0;
    return mayRetry ? this.commit(change, retriesLeft - 1) : { kind: 'conflict' };
  }
}
