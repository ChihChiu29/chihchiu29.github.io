namespace QLib {
  // Helps to wrap a primitive variable into a mutable object so you can
  // pass reference to others and they can modify its value.
  export class PrimitiveRef<T> {
    private value: T;

    constructor(initialValue: T) {
      this.value = initialValue;
    }

    set(value: T): void {
      this.value = value;
    }

    get(): T {
      return this.value;
    }
  }
}  // QLib

// My enhancement on top of native Phaser objects.
namespace QPhaser {
  // Also make it easier to use infinite tween etc.
  export class Prefab extends Phaser.GameObjects.Container {
    // Manages infinite tweens on objects in this container.
    private tweens: Phaser.Tweens.Tween[] = [];

    // Called when added to scene, use `QPhaser.Scene` object and you don't need to explicitly call this.
    // @Abstract
    init(): void { }

    // Update method, use the `Scene` object from this file and you don't need to explicitly call this.
    // @Abstract
    update(time: number, delta: number): void {
      super.update(time, delta);
    };

    // Use this to add and manage tween that never finishes.
    // Use `scene.tweens.add` etc. to directly add/remove temporary tweens.
    addInfiniteTween(tween: Phaser.Types.Tweens.TweenBuilderConfig | object) {
      this.tweens.push(this.scene.add.tween(tween));
    }

    override destroy() {
      for (const t of this.tweens) {
        t.stop();
        t.remove();
      }
      super.destroy();
    }
  }

  // Wrapper extending a single `Arcade.Sprite` object with common accessor for it.
  // Do not use this object's position etc., use the wrapped image directly.
  // For any other elements other than mainImg, remember to:
  //  - add them use `this.scene.add`, do not add other physics objects.
  //  - add them to container using `this.add`.
  //  - manually update them using mainImg as the only reference in `update`.
  export class ArcadePrefab extends Prefab {
    // The actual physical object.
    private mainImg?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    protected mainImgInitialX = 0;
    protected mainImgInitialY = 0;

    private needToApplyVelocity = false;
    private velocityToBeAppliedX = 0;
    private velocityToBeAppliedY = 0;
    private velocityLastActionTime: Map<string, number> = new Map();

    constructor(scene: Phaser.Scene, imgInitialX: number, imgInitialY: number) {
      // Always use world coordinates.
      super(scene, 0, 0);
      this.mainImgInitialX = imgInitialX;
      this.mainImgInitialY = imgInitialY;
    }

    override update(time: number, delta: number) {
      super.update(time, delta);
      this.maybeActOnMainImg((img) => {
        if (this.needToApplyVelocity) {
          img.setVelocity(
            img.body.velocity.x + this.velocityToBeAppliedX,
            img.body.velocity.y + this.velocityToBeAppliedY,
          );
          this.needToApplyVelocity = false;
          this.velocityToBeAppliedX = 0;
          this.velocityToBeAppliedY = 0;
        }
      });
    }

    // Sets the main image, also sets it position to initial (x, y).
    public setMainImage(img: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
      img.x = this.mainImgInitialX;
      img.y = this.mainImgInitialY;
      this.mainImg = img;
      this.add(img);
    }

    // Calls action if `mainImg` is valid, otherwise it's an no-op.
    public maybeActOnMainImg(
      action: (mainImg: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => void,
    ): void {
      const img = this.getMainImg();
      if (img) {
        action(img);
      }
    }

    // Velocity vector added via this function will be applied on top of the current
    // velocity of the object in the next `update`.
    // Note that this is helpful to add "one-shot" velocity, and it won't work well
    // for "continous" cases like "when key A is down move at speed 200".
    // If multiple calls are made from the same `source` within `oncePerDurationMs`,
    // only the first one has effect.
    // Returns if action was taken.
    public applyVelocity(
      x: number, y: number,
      source: string = '',
      oncePerDurationMs: number = 0,
    ): boolean {
      const lastActionTime = this.velocityLastActionTime.get(source);
      const now = QTime.now();
      if (!lastActionTime || now - lastActionTime > oncePerDurationMs) {
        this.velocityToBeAppliedX += x;
        this.velocityToBeAppliedY += y;
        this.needToApplyVelocity = true;
        this.velocityLastActionTime.set(source, now);
        return true;
      }
      return false;
    }

    // Makes it easeir to not use maybeActOnMainImg when you only care about its position.
    // Returns (0, 0) if not valid.
    public getPosition(): QPoint {
      const img = this.getMainImg();
      if (img) {
        return { x: img.x, y: img.y };
      } else {
        return { x: 0, y: 0 };
      }
    }

    // Convenience functions to override velocities for x/y components.
    public setVelocityX(value: number) {
      this.maybeActOnMainImg((img) => { img.setVelocityX(value); });
    }
    public setVelocityY(value: number) {
      this.maybeActOnMainImg((img) => { img.setVelocityY(value); });
    }

    // You can set mainImage directly using the property; but use this function to read it.
    private getMainImg(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined {
      if (!this.mainImg) {
        return undefined;
      } else if (!this.mainImg.active) {
        return undefined;
      }
      return this.mainImg;
    }
  }

  // Make it easy for a scene to use `QPrefab`s.
  // Added several features:
  //   - Prefab management. Use `addPrefab` instead of `add.existing` 
  //     when adding new `QPrefab` objects.
  //   - A timer.
  export class Scene extends Phaser.Scene {
    // Time since scene starts; reset if the scene is recreated.
    // This is different from the `time` passed to `update` which is the
    // total game time.
    // It's only used by base class as a way for tracking, and subclasses
    // and safely modify this for their needs.
    protected timeSinceSceneStartMs = 0;

    private registeredPrefabs = new Set<Prefab>();

    create() {
      this.timeSinceSceneStartMs = 0;
    }

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

    override update(time: number, delta: number): void {
      super.update(time, delta);

      this.timeSinceSceneStartMs += delta;

      for (const prefab of this.registeredPrefabs) {
        prefab.update(time, delta);
      }
    };
  }

  // Helps to maintain tweens that cannot happen in parallel for an object.
  // When adding/updating a new tween using `update`, the previous one will be deleted.
  export class SingletonTween {
    private existing?: Phaser.Tweens.Tween;

    // Note that removing a tween does not reset its properties, so you better
    // manually reset the properties you want the tween to animate.
    update(tween: Phaser.Tweens.Tween) {
      if (this.existing && this.existing.isPlaying()) {
        this.existing.stop();
        this.existing.remove();
      }

      this.existing = tween;
    }
  }

  export function collectImgs(prefabs: ArcadePrefab[]): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] {
    const imgs: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
    for (const prefab of prefabs) {
      prefab.maybeActOnMainImg((img) => {
        imgs.push(img);
      });
    }
    return imgs;
  }
}  // QPhaser

// Time and task related functions.
namespace QTime {

  /**
   * A counter that returns number of count actions within a time period.
   * For example this can help to throttle actions, like:
   * ```TypeScript
   *   const counter = TimedCounter(200);
   *   counter.count();
   *   // ...
   *   if (counter.count() === 0) {
   *     // do actions
   *   } else {
   *     // happening too soon
   *   }
   * ```
   */
  export class TimedCounter {
    private durationMs = 0;

    private currentCount = 0;
    private lastActionTime = 0;

    constructor(durationMs: number) {
      this.durationMs = durationMs;
    }

    // Imposes a "count" action. If the last action was older by more than
    // `this.durationMS`, this function clears internal counter and return 0,
    // otherwise it returns the number of "count" actions since the last time
    // counter was cleared.
    public count(): integer {
      const now = QTime.now();
      if (now - this.lastActionTime > this.durationMs) {
        this.currentCount = 0;
        this.lastActionTime = now;
      } else {
        this.currentCount++;
      }
      return this.currentCount;
    }
  }

  // A variable that cannot be changed more frequently than every durationMs.
  // It's most useful when you wants to update a value in update loop, but
  // does not want the update to happen too soon.
  export class SluggishVariable<T> {
    private durationMs = 0;
    private lastChangeTime = 0;
    private value: T;

    constructor(initialValue: T, durationMs: number) {
      this.value = initialValue;
      this.durationMs = durationMs;
      this.lastChangeTime = QTime.now();
    }

    // Sets to a new value, if the last time this was changed was more than
    // this.durationMs ago. Returns if new value was set or rejected.
    public maybeSet(newValue: T): boolean {
      if (QTime.now() - this.lastChangeTime > this.durationMs) {
        this.set(newValue);
        return true;
      } else {
        return false;
      }
    }

    public set(newValue: T) {
      this.value = newValue;
      this.lastChangeTime = QTime.now();
    }

    public get(): T {
      return this.value;
    }
  }

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
}  // QTime

namespace QString {
  export function stringContains(str: string, substring: string): boolean {
    return str.indexOf(substring) >= 0;
  }
}  // QString

namespace QUI {
  export function createKeyMap(scene: Phaser.Scene) {
    const keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    keys.W = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keys.A = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keys.S = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keys.D = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    return keys;
  }

  // Create texts suitable as title, centered at the given position.
  export function createTextTitle(
    scene: Phaser.Scene,
    content: string[],
    x: number, y: number,
    fontSize: number = 50): Phaser.GameObjects.Text {
    return scene.add.text(x, y, content, {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: '1.5em',
      color: '#8c085a',
      strokeThickness: 4,
      stroke: '#a8f7bd',
      align: 'center',
    })
      .setOrigin(0.5)
      .setFontSize(fontSize);
  }

  export function createButton(
    scene: Phaser.Scene,
    text: string,
    x: number, y: number,
    clickCallbackFn: () => void,
    fontSize: number = 40): Phaser.GameObjects.Text {
    const button = scene.add.text(x, y, text)
      .setOrigin(0.5)
      .setPadding(20)
      .setFontSize(fontSize)
      .setStyle({ backgroundColor: '#111' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', clickCallbackFn);
    button.on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
    button.on('pointerout', () => button.setStyle({ fill: '#FFF' }));
    return button;
  }

  export function createIconButton(
    scene: Phaser.Scene,
    spriteKey: string, spriteFrame: number,
    x: number, y: number,
    width: number, height: number,
    clickCallbackFn: () => void,
  ): Phaser.GameObjects.Sprite {
    const box = scene.add.rectangle(x, y, width, height, 0xf39c12, 0.1);
    const button = scene.add.sprite(x, y, spriteKey, spriteFrame)
      .setInteractive()
      .setDisplaySize(width * 0.8, height * 0.8)
      .on('pointerdown', clickCallbackFn);
    return button;
  }
}  // QUI

namespace QMath {
  export interface QPoint {
    x: number,
    y: number,
  }

  export const constants = {
    PI_ONE_HALF: Math.PI / 2,
    PI_ONE_QUARTER: Math.PI / 4,
    PI_THREE_QUARTER: Math.PI * 3 / 4,
  }
}  // QMath
