// My enhancement on top of native Phaser objects.
namespace QPhaser {

  // Wrapper extending a single `Matter.Image` object with common accessor for it.
  // Do not use this object's position etc., use the wrapped image directly.
  // The reason is to make it easier to add additional content to the container, helper API etc.
  export class Prefab extends Phaser.GameObjects.Container {
    // The actual physical object.
    private mainImage?: Phaser.Physics.Matter.Image;
    // Manages infinite tweens on objects in this container.
    private tweens: Phaser.Tweens.Tween[] = [];

    // Called when added to scene, use `Scene` object and you don't need to explicitly call this.
    // @Abstract
    init(): void { }

    // Update method, use the `Scene` object from this file and you don't need to explicitly call this.
    // @Abstract
    update(time: number, delta: number): void {
      super.update(time, delta);
    };

    setMainImage(img: Phaser.Physics.Matter.Image) {
      this.mainImage = img;
    }

    // Calls action if `mainImage` is valid, otherwise it's an no-op.
    maybeActOnMainImage(action: (mainImage: Phaser.Physics.Matter.Image) => void): void {
      const img = this.getMainImage();
      if (img) {
        action(img);
      }
    }

    // You can set mainImage directly using the property; but use this function to read it.
    private getMainImage(): Phaser.Physics.Matter.Image | undefined {
      if (!this.mainImage) {
        return undefined;
      } else if (!this.mainImage.active) {
        return undefined;
      }
      return this.mainImage;
    }

    // Use this to add and manage tween that never finishes.
    // Use `scene.tweens.add` etc. to directly add/remove temporary tweens.
    addInfiniteTween(tween: Phaser.Types.Tweens.TweenBuilderConfig | object) {
      this.tweens.push(this.scene.add.tween(tween));
    }

    // @Override
    destroy() {
      for (const t of this.tweens) {
        t.stop();
        t.remove();
      }
      super.destroy();
    }
  }

  // Make it easy for a scene to use `QPrefab`s.
  // Use `addPrefab` instead of `add.existing` when adding new `QPrefab` objects.
  export class Scene extends Phaser.Scene {
    private registeredPrefabs = new Set<Prefab>();

    // Adds a new prefab to be managed.
    addPrefab(prefab: Prefab) {
      prefab.init();
      this.add.existing(prefab);
      this.registeredPrefabs.add(prefab);
    }

    // Destroys a managed prefab.
    destroyPrefab(prefab: Prefab) {
      this.registeredPrefabs.delete(prefab);
      prefab.destroy();
    }

    // @Override
    update(time: number, delta: number): void {
      super.update(time, delta);

      for (const prefab of this.registeredPrefabs) {
        prefab.update(time, delta);
      }
    };
  }

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