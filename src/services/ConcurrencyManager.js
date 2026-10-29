/**
 * ConcurrencyManager
 * Manages asynchronous mutex locks to prevent race conditions during concurrent vehicle
 * check-in and spot allocation across multiple gates.
 */

class Mutex {
  constructor() {
    this._locked = false;
    this._queue = [];
  }

  /**
   * Acquires the lock; resolves when acquired.
   * @returns {Promise<Function>} release function
   */
  acquire() {
    return new Promise((resolve) => {
      const release = () => {
        if (this._queue.length > 0) {
          const next = this._queue.shift();
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

  /**
   * Executes an asynchronous task inside the lock, ensuring exclusive access.
   * @template T
   * @param {() => Promise<T>|T} task
   * @returns {Promise<T>}
   */
  async runExclusive(task) {
    const release = await this.acquire();
    try {
      return await task();
    } finally {
      release();
    }
  }

  isLocked() {
    return this._locked;
  }

  queueLength() {
    return this._queue.length;
  }
}

class ConcurrencyManager {
  constructor() {
    // Global mutex for spot allocation pipeline
    this.allocationMutex = new Mutex();
    // Granular spot-level locks map for checkout/updates
    this.spotLocks = new Map();
  }

  /**
   * Executes spot allocation exclusively
   * @template T
   * @param {() => Promise<T>|T} criticalSection
   * @returns {Promise<T>}
   */
  async withAllocationLock(criticalSection) {
    return this.allocationMutex.runExclusive(criticalSection);
  }

  /**
   * Acquires a lock for a specific spot ID
   * @param {string} spotId
   * @returns {Mutex}
   */
  getSpotMutex(spotId) {
    if (!this.spotLocks.has(spotId)) {
      this.spotLocks.set(spotId, new Mutex());
    }
    return this.spotLocks.get(spotId);
  }

  /**
   * Executes an operation with a spot-level lock
   * @template T
   * @param {string} spotId
   * @param {() => Promise<T>|T} criticalSection
   * @returns {Promise<T>}
   */
  async withSpotLock(spotId, criticalSection) {
    const mutex = this.getSpotMutex(spotId);
    return mutex.runExclusive(criticalSection);
  }
}

module.exports = {
  Mutex,
  ConcurrencyManager
};
