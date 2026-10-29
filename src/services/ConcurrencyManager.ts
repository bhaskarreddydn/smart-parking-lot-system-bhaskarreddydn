/**
 * ConcurrencyManager
 * Manages asynchronous mutex locks to prevent race conditions during concurrent vehicle
 * check-in and spot allocation across multiple gates.
 */

export class Mutex {
  private _locked: boolean = false;
  private _queue: Array<(release: () => void) => void> = [];

  public acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this._queue.length > 0) {
          const next = this._queue.shift()!;
          next(release);
        } else {
          this._locked = false;
        }
      };

      if (!this._locked) {
        this._locked = true;
        resolve(release);
      } else {
        this._queue.push(resolve);
      }
    });
  }

  public async runExclusive<T>(task: () => Promise<T> | T): Promise<T> {
    const release = await this.acquire();
    try {
      return await task();
    } finally {
      release();
    }
  }

  public isLocked(): boolean {
    return this._locked;
  }

  public queueLength(): number {
    return this._queue.length;
  }
}

export class ConcurrencyManager {
  private allocationMutex: Mutex = new Mutex();
  private spotLocks: Map<string, Mutex> = new Map<string, Mutex>();

  public async withAllocationLock<T>(criticalSection: () => Promise<T> | T): Promise<T> {
    return this.allocationMutex.runExclusive(criticalSection);
  }

  public getSpotMutex(spotId: string): Mutex {
    if (!this.spotLocks.has(spotId)) {
      this.spotLocks.set(spotId, new Mutex());
    }
    return this.spotLocks.get(spotId)!;
  }

  public async withSpotLock<T>(spotId: string, criticalSection: () => Promise<T> | T): Promise<T> {
    const mutex = this.getSpotMutex(spotId);
    return mutex.runExclusive(criticalSection);
  }
}
