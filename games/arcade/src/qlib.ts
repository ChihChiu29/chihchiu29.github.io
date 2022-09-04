// My enhancement on top of native Phaser objects.
namespace QPhaser {
  // Helps to maintain tweens that cannot happen in parallel for an object.
  // When adding/updating a new tween using `update`, the previous one will be deleted.
  export class SingletonTween {
    private existing?: Phaser.Tweens.Tween;

    update(tween: Phaser.Tweens.Tween) {
      if (this.existing && this.existing.isPlaying()) {
        this.existing.stop();
        this.existing.remove();
      }

      this.existing = tween;
    }
  }
}

// Time and task related functions.
namespace QTime {
  // Get current timestamp.
  export function now(): number {
    return new Date().getTime();
  }

  // Helps to maintain `setTimeout` actions that having a new one would erase the old one.
  export class AutoClearedTimeout {
    private existing?: number;

    update(timeoutFunction: () => void, timeoutDelay: number) {
      clearTimeout(this.existing);
      this.existing = setTimeout(timeoutFunction, timeoutDelay);
    }
  }

  // Helps to execute a list of timeout actions sequentially.
  export class QueuedTimeout {
    private queue: { timeoutFunction: (() => void), timeoutDelay: number }[] = [];
    private active: boolean = false;

    enqueue(timeoutFunction: () => void, timeoutDelay: number) {
      this.queue.push({ timeoutFunction, timeoutDelay });
      this.maybeExecuteNext();
    }

    private maybeExecuteNext() {
      if (this.active) {
        // No need to do anything, this function will be invoked in the future.
        return;
      }

      const saveThis = this;
      const next = this.queue.shift();
      if (next) {
        setTimeout(() => {
          next.timeoutFunction();
          saveThis.maybeExecuteNext();
        }, next.timeoutDelay);
      } else {
        saveThis.active = false;
      }
    }
  }

  // Helps to execute a sequence of actions with common delay between adjacent actions.
  export class SequenceActionThrottler {
    private queue: (() => void)[] = [];
    private delayBetweenActionsMs: number = 0;
    private previousActionTime: number = 0;
    private sheduled: boolean = false;

    constructor(delayMs: number) {
      this.delayBetweenActionsMs = delayMs;
      this.previousActionTime = now();
    }

    // Enqueues an action, also kicks off execution if not already.
    enqueue(action: () => void) {
      this.queue.push(action);
      this.maybeExecuteNext();
    }

    private maybeExecuteNext() {
      if (this.sheduled) {
        // No need to do anything, this function will be invoked in the future.
        return;
      }

      const saveThis = this;
      const delta = now() - this.previousActionTime;
      if (delta > this.delayBetweenActionsMs) {
        const nextAction = this.queue.shift();
        if (nextAction) {
          nextAction();
          saveThis.previousActionTime = now();
          saveThis.maybeExecuteNext();
        }
      } else {
        setTimeout(() => {
          saveThis.sheduled = false;
          saveThis.maybeExecuteNext();
        }, delta);
        this.sheduled = true;
      }
    }
  }
}

namespace QString {
  export function stringContains(str: string, substring: string): boolean {
    return str.indexOf(substring) >= 0;
  }
}