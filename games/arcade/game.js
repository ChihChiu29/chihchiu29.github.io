"use strict";
window.addEventListener('load', function () {
    var game = new Phaser.Game({
        width: CONST.GAME_WIDTH,
        height: CONST.GAME_HEIGHT,
        type: Phaser.AUTO,
        fps: {
            target: 60,
            forceSetTimeOut: true,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: TESTING,
            }
        },
        transparent: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
        }
    });
    game.scene.add('Boot', Boot, true);
    game.scene.add('StartScene', StartScene);
    game.scene.add('JumpDownStart', SceneJumpDownStart);
    game.scene.add('JumpDownMain', SceneJumpDownMain);
    game.scene.add('JumpDownEnd', SceneJumpDownEnd);
});
class Boot extends Phaser.Scene {
    preload() {
    }
    create() {
        this.scene.start('StartScene');
    }
}
var CONST;
(function (CONST) {
    CONST.GAME_WIDTH = 400;
    CONST.GAME_HEIGHT = 600;
    CONST.LAYERS = {
        DEFAULT: 0,
        BACKGROUND: -10,
        FRONT: 10,
        TEXT: 100,
    };
    CONST.INPUT = {
        SMALL_TIME_INTERVAL_MS: 200,
    };
    CONST.PLAYER_TYPE = {
        DEFAULT: 'SINGLE_SPRITE',
        ANIMATED: 'ANIMATED',
    };
})(CONST || (CONST = {}));
const TESTING = false;
const SCENE_KEYS = {
    JumpDownStart: 'JumpDownStart',
    JumpDownMain: 'JumpDownMain',
    JumpDownEnd: 'JumpDownEnd',
};
let GAME_CHOICE;
if (TESTING) {
    GAME_CHOICE = SCENE_KEYS.JumpDownMain;
}
else {
    GAME_CHOICE = SCENE_KEYS.JumpDownStart;
}
var GLOBAL;
(function (GLOBAL) {
    GLOBAL.bestScores = [];
    // Current global game speed.
    GLOBAL.gameSpeed = 1.0;
})(GLOBAL || (GLOBAL = {}));
;
var QLib;
(function (QLib) {
    // Helps to wrap a primitive variable into a mutable object so you can
    // pass reference to others and they can modify its value.
    class PrimitiveRef {
        value;
        constructor(initialValue) {
            this.value = initialValue;
        }
        set(value) {
            this.value = value;
        }
        get() {
            return this.value;
        }
    }
    QLib.PrimitiveRef = PrimitiveRef;
})(QLib || (QLib = {})); // QLib
// My enhancement on top of native Phaser objects.
var QPhaser;
(function (QPhaser) {
    // Also make it easier to use infinite tween etc.
    class Prefab extends Phaser.GameObjects.Container {
        // Manages infinite tweens on objects in this container.
        tweens = [];
        // Called when added to scene, use `QPhaser.Scene` object and you don't need to explicitly call this.
        // @Abstract
        init() { }
        // Update method, use the `Scene` object from this file and you don't need to explicitly call this.
        // @Abstract
        update(time, delta) {
            super.update(time, delta);
        }
        ;
        // Use this to add and manage tween that never finishes.
        // Use `scene.tweens.add` etc. to directly add/remove temporary tweens.
        addInfiniteTween(tween) {
            this.tweens.push(this.scene.add.tween(tween));
        }
        destroy() {
            for (const t of this.tweens) {
                t.stop();
                t.remove();
            }
            super.destroy();
        }
    }
    QPhaser.Prefab = Prefab;
    // Wrapper extending a single `Arcade.Sprite` object with common accessor for it.
    // Do not use this object's position etc., use the wrapped image directly.
    // For any other elements other than mainImg, remember to:
    //  - add them use `this.scene.add`, do not add other physics objects.
    //  - add them to container using `this.add`.
    //  - manually update them using mainImg as the only reference in `update`.
    class ArcadePrefab extends Prefab {
        // The actual physical object.
        mainImg;
        mainImgInitialX = 0;
        mainImgInitialY = 0;
        needToApplyVelocity = false;
        velocityToBeAppliedX = 0;
        velocityToBeAppliedY = 0;
        velocityLastActionTime = new Map();
        constructor(scene, imgInitialX, imgInitialY) {
            // Always use world coordinates.
            super(scene, 0, 0);
            this.mainImgInitialX = imgInitialX;
            this.mainImgInitialY = imgInitialY;
        }
        update(time, delta) {
            super.update(time, delta);
            this.maybeActOnMainImg((img) => {
                if (this.needToApplyVelocity) {
                    img.setVelocity(img.body.velocity.x + this.velocityToBeAppliedX, img.body.velocity.y + this.velocityToBeAppliedY);
                    this.needToApplyVelocity = false;
                    this.velocityToBeAppliedX = 0;
                    this.velocityToBeAppliedY = 0;
                }
            });
        }
        // Sets the main image, also sets it position to initial (x, y).
        setMainImage(img) {
            img.x = this.mainImgInitialX;
            img.y = this.mainImgInitialY;
            this.mainImg = img;
            this.add(img);
        }
        // Calls action if `mainImg` is valid, otherwise it's an no-op.
        maybeActOnMainImg(action) {
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
        applyVelocity(x, y, source = '', oncePerDurationMs = 0) {
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
        getPosition() {
            const img = this.getMainImg();
            if (img) {
                return { x: img.x, y: img.y };
            }
            else {
                return { x: 0, y: 0 };
            }
        }
        // Convenience functions to override velocities for x/y components.
        setVelocityX(value) {
            this.maybeActOnMainImg((img) => { img.setVelocityX(value); });
        }
        setVelocityY(value) {
            this.maybeActOnMainImg((img) => { img.setVelocityY(value); });
        }
        // You can set mainImage directly using the property; but use this function to read it.
        getMainImg() {
            if (!this.mainImg) {
                return undefined;
            }
            else if (!this.mainImg.active) {
                return undefined;
            }
            return this.mainImg;
        }
    }
    QPhaser.ArcadePrefab = ArcadePrefab;
    // Make it easy for a scene to use `QPrefab`s.
    // Added several features:
    //   - Prefab management. Use `addPrefab` instead of `add.existing` 
    //     when adding new `QPrefab` objects.
    //   - A timer.
    class Scene extends Phaser.Scene {
        // Time since scene starts; reset if the scene is recreated.
        // This is different from the `time` passed to `update` which is the
        // total game time.
        // It's only used by base class as a way for tracking, and subclasses
        // and safely modify this for their needs.
        timeSinceSceneStartMs = 0;
        registeredPrefabs = new Set();
        create() {
            this.timeSinceSceneStartMs = 0;
        }
        // Adds a new prefab to be managed.
        addPrefab(prefab) {
            prefab.init();
            this.add.existing(prefab);
            this.registeredPrefabs.add(prefab);
        }
        // Destroys a managed prefab.
        destroyPrefab(prefab) {
            this.registeredPrefabs.delete(prefab);
            prefab.destroy();
        }
        update(time, delta) {
            super.update(time, delta);
            this.timeSinceSceneStartMs += delta;
            for (const prefab of this.registeredPrefabs) {
                prefab.update(time, delta);
            }
        }
        ;
    }
    QPhaser.Scene = Scene;
    // Helps to maintain tweens that cannot happen in parallel for an object.
    // When adding/updating a new tween using `update`, the previous one will be deleted.
    class SingletonTween {
        existing;
        // Note that removing a tween does not reset its properties, so you better
        // manually reset the properties you want the tween to animate.
        update(tween) {
            if (this.existing && this.existing.isPlaying()) {
                this.existing.stop();
                this.existing.remove();
            }
            this.existing = tween;
        }
    }
    QPhaser.SingletonTween = SingletonTween;
    function collectImgs(prefabs) {
        const imgs = [];
        for (const prefab of prefabs) {
            prefab.maybeActOnMainImg((img) => {
                imgs.push(img);
            });
        }
        return imgs;
    }
    QPhaser.collectImgs = collectImgs;
})(QPhaser || (QPhaser = {})); // QPhaser
// Time and task related functions.
var QTime;
(function (QTime) {
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
    class TimedCounter {
        durationMs = 0;
        currentCount = 0;
        lastActionTime = 0;
        constructor(durationMs) {
            this.durationMs = durationMs;
        }
        // Imposes a "count" action. If the last action was older by more than
        // `this.durationMS`, this function clears internal counter and return 0,
        // otherwise it returns the number of "count" actions since the last time
        // counter was cleared.
        count() {
            const now = QTime.now();
            if (now - this.lastActionTime > this.durationMs) {
                this.currentCount = 0;
                this.lastActionTime = now;
            }
            else {
                this.currentCount++;
            }
            return this.currentCount;
        }
    }
    QTime.TimedCounter = TimedCounter;
    // A variable that cannot be changed more frequently than every durationMs.
    // It's most useful when you wants to update a value in update loop, but
    // does not want the update to happen too soon.
    class SluggishVariable {
        durationMs = 0;
        lastChangeTime = 0;
        value;
        constructor(initialValue, durationMs) {
            this.value = initialValue;
            this.durationMs = durationMs;
            this.lastChangeTime = QTime.now();
        }
        // Sets to a new value, if the last time this was changed was more than
        // this.durationMs ago. Returns if new value was set or rejected.
        maybeSet(newValue) {
            if (QTime.now() - this.lastChangeTime > this.durationMs) {
                this.set(newValue);
                return true;
            }
            else {
                return false;
            }
        }
        set(newValue) {
            this.value = newValue;
            this.lastChangeTime = QTime.now();
        }
        get() {
            return this.value;
        }
    }
    QTime.SluggishVariable = SluggishVariable;
    // Get current timestamp.
    function now() {
        return new Date().getTime();
    }
    QTime.now = now;
    // Helps to maintain `setTimeout` actions that having a new one would erase the old one.
    class AutoClearedTimeout {
        existing;
        update(timeoutFunction, timeoutDelay) {
            clearTimeout(this.existing);
            this.existing = setTimeout(timeoutFunction, timeoutDelay);
        }
    }
    QTime.AutoClearedTimeout = AutoClearedTimeout;
    // Helps to execute a list of timeout actions sequentially.
    class QueuedTimeout {
        queue = [];
        active = false;
        enqueue(timeoutFunction, timeoutDelay) {
            this.queue.push({ timeoutFunction, timeoutDelay });
            this.maybeExecuteNext();
        }
        maybeExecuteNext() {
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
            }
            else {
                saveThis.active = false;
            }
        }
    }
    QTime.QueuedTimeout = QueuedTimeout;
    // Helps to execute a sequence of actions with common delay between adjacent actions.
    class SequenceActionThrottler {
        queue = [];
        delayBetweenActionsMs = 0;
        previousActionTime = 0;
        sheduled = false;
        constructor(delayMs) {
            this.delayBetweenActionsMs = delayMs;
            this.previousActionTime = now();
        }
        // Enqueues an action, also kicks off execution if not already.
        enqueue(action) {
            this.queue.push(action);
            this.maybeExecuteNext();
        }
        maybeExecuteNext() {
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
            }
            else {
                setTimeout(() => {
                    saveThis.sheduled = false;
                    saveThis.maybeExecuteNext();
                }, delta);
                this.sheduled = true;
            }
        }
    }
    QTime.SequenceActionThrottler = SequenceActionThrottler;
})(QTime || (QTime = {})); // QTime
var QString;
(function (QString) {
    function stringContains(str, substring) {
        return str.indexOf(substring) >= 0;
    }
    QString.stringContains = stringContains;
})(QString || (QString = {})); // QString
var QUI;
(function (QUI) {
    function createKeyMap(scene) {
        const keys = {};
        keys.W = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        keys.A = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keys.S = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keys.D = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        return keys;
    }
    QUI.createKeyMap = createKeyMap;
    // Create texts suitable as title, centered at the given position.
    function createTextTitle(scene, content, x, y, fontSize = 50) {
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
    QUI.createTextTitle = createTextTitle;
    function createButton(scene, text, x, y, clickCallbackFn, fontSize = 40) {
        const button = scene.add.text(x, y, text)
            .setOrigin(0.5)
            .setPadding(20)
            .setFontSize(fontSize)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', clickCallbackFn);
        button.on('pointerover', () => button.setStyle({ fill: '#f39c12' }));
        button.on('pointerout', () => button.setStyle({ fill: '#FFF' }));
        return button;
    }
    QUI.createButton = createButton;
    function createIconButton(scene, spriteKey, spriteFrame, x, y, width, height, clickCallbackFn) {
        const box = scene.add.rectangle(x, y, width, height, 0xf39c12, 0.1);
        const button = scene.add.sprite(x, y, spriteKey, spriteFrame)
            .setInteractive()
            .setDisplaySize(width * 0.8, height * 0.8)
            .on('pointerdown', clickCallbackFn);
        return button;
    }
    QUI.createIconButton = createIconButton;
})(QUI || (QUI = {})); // QUI
var QMath;
(function (QMath) {
    QMath.constants = {
        PI_ONE_HALF: Math.PI / 2,
        PI_ONE_QUARTER: Math.PI / 4,
        PI_THREE_QUARTER: Math.PI * 3 / 4,
    };
})(QMath || (QMath = {})); // QMath
// Base class for arcade platform player.
// It handles user input and setting velocity etc., but it does not handle
// rendering and it's not directly useable.
// When subclassing this class, create elements in `init`.
// And performs necessary actions in `update`.
class ArcadePlayerBase extends QPhaser.ArcadePrefab {
    TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
    TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;
    playerLeftRightSpeed = 160;
    // Undefined means dash is diabled.
    playerLeftRightDashSpeed;
    playerJumpSpeed = 250;
    // How many jumps are allowed when not on the groud.
    playerNumAllowedJumps = 1;
    INPUT_TYPE = {
        NEUTRAL: 'NEUTRAL',
        UP: 'UP',
        LEFT: 'LEFT',
        RIGHT: 'RIGHT',
    };
    // Last few neutral input actions that finished (key up).
    recentInputs = [];
    // Last input action that can be ongoing (key down), can be neutral.
    lastInput = '';
    // Used to control when can double jump.
    numJumpsSinceLastLanding = new QTime.SluggishVariable(0, 50);
    keys = {};
    init() {
        // Input.
        this.keys = QUI.createKeyMap(this.scene);
        this.scene.input.addPointer(3); // needs at most 3 touch points (most 2 are valid).
    }
    update(time, delta) {
        super.update(time, delta);
        this.maybeActOnMainImg((img) => {
            this.handleInput(img);
        });
    }
    // @abstract
    // For subclass to take actions in `update`, with given player 
    // input action info.
    takeExtraActionsDuringUpdate(direction, // INPUT_TYPE (only left/right/neutral)
    isDashing, // whether the player is dashing (double-same-input)
    inAir, // whether player is in air or grounded
    isJumping) { }
    handleInput(img) {
        // First get user intention.
        // Keyboard based control.
        let moveLeft = this.keys.A.isDown;
        let moveRight = this.keys.D.isDown;
        let moveUp = this.keys.W.isDown;
        // Touch screen based control.
        for (const ptr of [
            this.scene.input.pointer1,
            this.scene.input.pointer2,
            this.scene.input.pointer3,
            this.scene.input.pointer4
        ]) {
            if (ptr.isDown) {
                if (ptr.downX < this.TOUCH_LEFT_BOUNDARY) {
                    moveLeft = true;
                }
                if (ptr.downX > this.TOUCH_RIGHT_BOUNDARY) {
                    moveRight = true;
                }
                if (this.TOUCH_LEFT_BOUNDARY <= ptr.downX && this.TOUCH_RIGHT_BOUNDARY >= ptr.downX) {
                    moveUp = true;
                }
            }
        }
        // Update last and recent input actions.
        let currentInput = this.INPUT_TYPE.NEUTRAL;
        // It could be both up and left/right, in which case we record up since
        // left/right can be continously holding down but not jump.
        if (moveUp) {
            currentInput = this.INPUT_TYPE.UP;
        }
        else if (moveLeft) {
            currentInput = this.INPUT_TYPE.LEFT;
        }
        else if (moveRight) {
            currentInput = this.INPUT_TYPE.RIGHT;
        }
        // Handle move intentions.
        // Collect these properties for subclass
        let moveDirection = this.INPUT_TYPE.NEUTRAL;
        let isDashing = false;
        let inAir = !img.body.touching.down;
        let isJumping = false; // action
        // The input actions in `this.recentInputs` are guaranteed to be
        // separated by another input action.
        const previousInputAction = this.recentInputs[this.recentInputs.length - 1];
        if (moveLeft) {
            moveDirection = this.INPUT_TYPE.LEFT;
            if (this.playerLeftRightDashSpeed && previousInputAction === this.INPUT_TYPE.LEFT) {
                // dash left
                img.setVelocity(-this.playerLeftRightDashSpeed);
                isDashing = true;
            }
            else {
                img.setVelocityX(-this.playerLeftRightSpeed);
            }
        }
        else if (moveRight) {
            moveDirection = this.INPUT_TYPE.RIGHT;
            if (this.playerLeftRightDashSpeed && previousInputAction === this.INPUT_TYPE.RIGHT) {
                // dash right
                img.setVelocity(this.playerLeftRightDashSpeed);
                isDashing = true;
            }
            else {
                img.setVelocityX(this.playerLeftRightSpeed);
            }
        }
        else {
            img.setVelocityX(0);
        }
        // Separated if since up and left/right could co-happen.
        if (moveUp) {
            // The logic is this: the number of allowed jumps are broken into two
            // categories:
            //  - 1. Ground jump.
            //  - 2. Air jump.
            // The first part check ground jump. It has to check if the player is
            // grounded instead of just using numJumpsSinceLastLanding because
            // otherwise player can fall off a ground and still make a "ground jump".
            // The second part (else) checks for air jump, which uses
            // (playerNumAllowedJumps - 1) as the number of allowed jump.
            if (img.body.touching.down) {
                // On ground -- try to set numJumpsSinceLastLanding to 0.
                if (this.numJumpsSinceLastLanding.maybeSet(0)) {
                    // If we are able to set, make a new jump.
                    if (this.playerNumAllowedJumps > 0) {
                        this.applyVelocity(0, -this.playerJumpSpeed);
                        isJumping = true;
                    }
                }
            }
            else {
                // In air.
                // We check currentInput not the same as lastInput because for
                // air jump, we only want the jump to happen if user released UP
                // then pressed it again. This is different than ground jump where
                // holding UP can make the character jump.
                if (currentInput !== this.lastInput) {
                    const numJump = this.numJumpsSinceLastLanding.get();
                    // -1 since the first jump has be on ground.
                    if (numJump < this.playerNumAllowedJumps - 1) {
                        if (this.numJumpsSinceLastLanding.maybeSet(numJump + 1)) {
                            this.applyVelocity(0, -this.playerJumpSpeed);
                            isJumping = true;
                        }
                    }
                }
            }
        }
        // Subclass actions.
        this.takeExtraActionsDuringUpdate(moveDirection, isDashing, inAir, isJumping);
        // Post action tracking updates.
        // Updates input tracking.
        if (currentInput !== this.lastInput) {
            this.recentInputs.unshift(this.lastInput);
            this.recentInputs.splice(5);
            this.lastInput = currentInput;
            // console.log(this.lastInput);
        }
        // For multi-jump.
        if (img.body.touching.down) {
            // Needs to wait a bit to set if "just" jumped.
            this.numJumpsSinceLastLanding.maybeSet(0);
        }
    }
}
// Base class for a sprite in arcade.
// Has APIs to specify collision behaviors.
class ArcadeSprite extends QPhaser.ArcadePrefab {
    tileInitialSize = 0;
    spriteKey = '';
    frameIndex = 0;
    constructor(scene, imgInitialX, imgInitialY, spriteKey, frameIndex = 0, tileInitialSize = 20, 
    // Platform sprite ignores gravity and is "immovable".
    isPlatform = true) {
        super(scene, imgInitialX, imgInitialY);
        this.tileInitialSize = tileInitialSize;
        this.spriteKey = spriteKey;
        this.frameIndex = frameIndex;
        const img = this.scene.physics.add.sprite(this.mainImgInitialX, this.mainImgInitialY, spriteKey, frameIndex);
        img.setDisplaySize(tileInitialSize, tileInitialSize);
        if (isPlatform) {
            img.setImmovable(true);
            img.body.allowGravity = false;
        }
        this.setMainImage(img);
    }
    // Sets that this tile collides with the given prefabs.
    setCollideWith(prefabs) {
        this.setCollideWithGameObjects(QPhaser.collectImgs(prefabs));
    }
    // Sets that this tile collides with the given gameobjects.
    setCollideWithGameObjects(gameObjs) {
        this.maybeActOnMainImg((img) => {
            this.scene.physics.add.collider(img, gameObjs);
        });
    }
    // Sets that when this tile touch the given prefabs, what happens.
    setOverlapWith(prefabs, callback) {
        this.setOverlapWithGameObjects(QPhaser.collectImgs(prefabs), callback);
    }
    // Sets that when this tile touch the given gameobjects, what happens.
    // Callback is given (tile, other) as arguments.
    setOverlapWithGameObjects(gameObjs, callback) {
        this.maybeActOnMainImg((img) => {
            this.scene.physics.add.overlap(img, gameObjs, callback);
        });
    }
}
// Basic item class.
class ItemBase extends ArcadeSprite {
    constructor(scene, imgInitialX, imgInitialY, spriteKey, frameIndex = 0, tileInitialSize = 20) {
        super(scene, imgInitialX, imgInitialY, spriteKey, frameIndex, tileInitialSize, /*isPlatform*/ false);
    }
}
// Base class for a platform tile that moves up.
class TileMovingUp extends ArcadeSprite {
    initialSpeed = 0;
    multiplier = new QLib.PrimitiveRef(0);
    constructor(scene, imgInitialX, imgInitialY, initialSpeed, speedMultiplier, spriteKey, frameIndex = 0, tileInitialSize = 20) {
        super(scene, imgInitialX, imgInitialY, spriteKey, frameIndex, tileInitialSize, /*isPlatform*/ true);
        this.initialSpeed = initialSpeed;
        this.multiplier = speedMultiplier;
    }
    update(time, delta) {
        super.update(time, delta);
        this.setVelocityY(-this.initialSpeed * this.multiplier.get());
    }
}
class ChatPopup extends Phaser.GameObjects.Container {
    text;
    border;
    // Note that `setPosition` will then set top-left position.
    constructor(scene, left, top, width, height, content, faceRight) {
        super(scene, left ?? 0, top ?? 0);
        width = width ?? 100;
        height = height ?? 100;
        faceRight = faceRight ?? false;
        // Used to draw the "conversation tip". Note that the actual height of the text box is shorter by `deltaY`.
        const deltaX = width / 6;
        const deltaY = height / 5;
        const realY = height - deltaY;
        if (faceRight) {
            this.border = scene.add.polygon(width / 2, height / 2, [
                { x: 0, y: realY },
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: realY },
                { x: width - deltaX, y: realY },
                { x: width - deltaX, y: height },
                { x: width - (deltaX + deltaX), y: realY },
            ]);
        }
        else {
            this.border = scene.add.polygon(width / 2, height / 2, [
                { x: 0, y: realY },
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: realY },
                { x: deltaX + deltaX, y: realY },
                { x: deltaX, y: height },
                { x: deltaX, y: realY },
            ]);
        }
        this.border.setStrokeStyle(2, 0x325ca8);
        this.border.isFilled = true;
        this.add(this.border);
        this.text = scene.add.text(5, 5, content ?? ['hello world']); // 5 is gap to top-left.
        this.add(this.text);
        this.text.setColor('#037bfc');
    }
}
class EffectPopupText extends Phaser.GameObjects.Container {
    constructor(scene, x, y, content, popupDeltaY, durationMs, fontSize = 36) {
        super(scene, x, y);
        const text = scene.add.text(x, y, content, {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            color: '#ebbd34',
            strokeThickness: 1,
            stroke: '#ebbd34',
            align: 'center',
        })
            .setOrigin(0.5).setFontSize(fontSize);
        scene.add.tween({
            targets: text,
            y: y - popupDeltaY,
            duration: durationMs,
            repeat: false,
            onComplete: () => {
                text.destroy();
            },
        });
    }
}
// Item that adds time/score when collected.
class ItemAddTime extends ItemBase {
    setEffect(
    // Plural: maybe coop in the future?
    playerPrefabs, 
    // The function to call to add time/score.
    addScoreFn, 
    // The score to add is a random number between these two.
    addScoreMinMs = 1000, addScoreMaxMs = 5000) {
        this.setOverlapWith(playerPrefabs, (self, other) => {
            const amount = Phaser.Math.Between(addScoreMinMs, addScoreMaxMs);
            addScoreFn(amount);
            const { x, y } = this.getPosition();
            const popupEffect = new EffectPopupText(this.scene, x, y, [`+${(amount / 1000).toFixed(1)}`], 100, 400);
            this.scene.add.existing(popupEffect);
            this.destroy();
        });
    }
}
// A player with all animations from the same spritesheet.
class PlayerAnimatedSingleSheet extends ArcadePlayerBase {
    ANIME_KEY = {
        STILL: 'PlayerAnimatedSingleSheet_STILL',
        RUN: 'PlayerAnimatedSingleSheet_RUN',
        JUMP: 'PlayerAnimatedSingleSheet_JUMP',
        DASH: 'PlayerAnimatedSingleSheet_DASH',
    };
    cfg;
    bloatEffect = new QPhaser.SingletonTween();
    constructor(scene, imgInitialX, imgInitialY, playerData) {
        super(scene, imgInitialX, imgInitialY);
        this.cfg = playerData;
    }
    init() {
        super.init();
        const spritesheetKey = this.cfg.spritesheetKey;
        const frameRate = this.cfg.frameRate;
        const player = this.scene.physics.add.sprite(0, 0, spritesheetKey, this.cfg.frameStill);
        player.setCollideWorldBounds(true);
        player.setBounce(0);
        player.setFrictionX(1);
        player.setDisplaySize(this.cfg.size, this.cfg.size);
        this.setMainImage(player);
        this.scene.anims.create({
            key: this.ANIME_KEY.STILL,
            frames: [{ key: spritesheetKey, frame: this.cfg.frameStill }],
            frameRate: frameRate,
            repeat: -1
        });
        this.scene.anims.create({
            key: this.ANIME_KEY.RUN,
            frames: this.scene.anims.generateFrameNumbers(spritesheetKey, { start: this.cfg.frameRunStart, end: this.cfg.frameRunEnd }),
            frameRate: frameRate,
            repeat: -1
        });
        this.scene.anims.create({
            key: this.ANIME_KEY.JUMP,
            frames: this.scene.anims.generateFrameNumbers(spritesheetKey, { start: this.cfg.frameJumpStart, end: this.cfg.frameJumpEnd }),
            frameRate: frameRate,
            repeat: -1
        });
    }
    takeExtraActionsDuringUpdate(direction, isDashing, inAir, isJumping) {
        this.maybeActOnMainImg((img) => {
            if (direction !== this.INPUT_TYPE.NEUTRAL) {
                if (inAir) {
                    img.play(this.ANIME_KEY.JUMP);
                }
                else {
                    img.play(this.ANIME_KEY.RUN);
                }
                if (this.cfg.spritesheetFacingLeft) {
                    img.setFlipX(direction === this.INPUT_TYPE.RIGHT);
                }
                else {
                    img.setFlipX(direction === this.INPUT_TYPE.LEFT);
                }
            }
            else {
                img.play(this.ANIME_KEY.STILL);
            }
            if (isJumping) {
                img.setDisplaySize(this.cfg.size, this.cfg.size);
                this.bloatEffect.update(this.scene.add.tween({
                    targets: img,
                    displayWidth: this.cfg.size * 1.5,
                    displayHeight: this.cfg.size * 1.5,
                    duration: 150,
                    yoyo: true,
                    loop: false,
                }));
            }
        });
    }
}
class PlayerKennyCat extends ArcadePlayerBase {
    HEAD_IMAGE = 'scared';
    HEAD_IMAGE_SIZE = 32;
    SPRITESHEET_NAME = 'tile_characters';
    ANIME_RUN = 'PlayerKennyCat_run';
    ANIME_STOP = 'PlayerKennyCat_stop';
    // The sprite for the leg movement.
    legSprite;
    init() {
        super.init();
        // Leg.
        const legSprite = this.scene.add.sprite(0, 0, this.SPRITESHEET_NAME);
        legSprite.setSize(this.HEAD_IMAGE_SIZE, this.HEAD_IMAGE_SIZE);
        this.add(legSprite);
        this.scene.anims.create({
            key: this.ANIME_RUN,
            frames: this.scene.anims.generateFrameNumbers(this.SPRITESHEET_NAME, { start: 6, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: this.ANIME_STOP,
            frames: [{ key: this.SPRITESHEET_NAME, frame: 4 }],
            frameRate: 10,
            repeat: -1
        });
        legSprite.anims.play(this.ANIME_RUN, true);
        this.legSprite = legSprite;
        // Head.
        const headSprite = this.scene.physics.add.sprite(0, 0, this.HEAD_IMAGE);
        headSprite.setCollideWorldBounds(true);
        headSprite.setBounce(0);
        headSprite.setFrictionX(1);
        // First change the physics body by raw size.
        headSprite.setSize(headSprite.width, headSprite.height * 1.3);
        // Then change the display size and body size.
        headSprite.setDisplaySize(this.HEAD_IMAGE_SIZE, this.HEAD_IMAGE_SIZE);
        // Shifts body down a bit to cover the leg.
        headSprite.setOffset(0, 16);
        this.setMainImage(headSprite);
        this.addInfiniteTween({
            targets: headSprite,
            displayWidth: this.HEAD_IMAGE_SIZE * 1.05,
            displayHeight: this.HEAD_IMAGE_SIZE * 1.05,
            duration: 200,
            yoyo: true,
            loop: -1,
        });
    }
    update(time, delta) {
        super.update(time, delta);
        this.maybeActOnMainImg((img) => {
            this.legSprite.x = img.x;
            this.legSprite.y = img.y + 12;
        });
    }
}
// A basic player that uses a single sprite.
class PlayerSingleSprite extends ArcadePlayerBase {
    cfg;
    constructor(scene, imgInitialX, imgInitialY, playerData) {
        super(scene, imgInitialX, imgInitialY);
        this.cfg = playerData;
    }
    init() {
        super.init();
        // Head.
        const headSprite = this.scene.physics.add.sprite(0, 0, this.cfg.spriteKey, this.cfg.spriteFrame);
        headSprite.setCollideWorldBounds(true);
        headSprite.setBounce(0);
        headSprite.setFrictionX(1);
        headSprite.setDisplaySize(this.cfg.size * 0.95, this.cfg.size * 0.95);
        this.setMainImage(headSprite);
        if (this.cfg.hasSpongeEffect) {
            this.addInfiniteTween({
                targets: headSprite,
                displayWidth: this.cfg.size,
                displayHeight: this.cfg.size,
                duration: 200,
                yoyo: true,
                loop: -1,
            });
        }
    }
    takeExtraActionsDuringUpdate(direction, isDashing, inAir, isJumping) {
        this.maybeActOnMainImg((img) => {
            if (direction === this.INPUT_TYPE.LEFT) {
                img.setFlipX(!this.cfg.facingLeft);
            }
            else if (direction === this.INPUT_TYPE.RIGHT) {
                img.setFlipX(this.cfg.facingLeft);
            }
        });
    }
}
// An area showing rotating texts.
class RotatingText extends QPhaser.Prefab {
    rotationSpeedX = 0; // per sec, leftwards
    rotationSpeedY = 10; // per sec, upwards
    textArea;
    textMaskLeft = 0;
    textMaskTop = 0;
    textMaskWidth = 320;
    textMaskHeight = 200;
    // Center and width/height of the shooting target spirte, the actual size is bigger because of other elements.
    constructor(scene, left, top, width, height, textAreaGap = 10) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.textMaskLeft = left ?? this.textMaskLeft;
        this.textMaskTop = top ?? this.textMaskTop;
        this.textMaskWidth = width ?? this.textMaskWidth;
        this.textMaskHeight = height ?? this.textMaskHeight;
        const textContent = scene.add.text(this.textMaskLeft + textAreaGap, this.textMaskTop, '', {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '2em',
            color: '#2f2ffa',
            strokeThickness: 8,
            stroke: '#d5d5f0',
        });
        this.add(textContent);
        textContent.setDepth(CONST.LAYERS.TEXT);
        this.textArea = textContent;
        const shape = scene.make.graphics({});
        shape.fillStyle(0xffffff);
        shape.beginPath();
        shape.fillRect(this.textMaskLeft, this.textMaskTop, this.textMaskWidth, this.textMaskHeight);
        const mask = shape.createGeometryMask();
        this.setMask(mask);
        if (TESTING) {
            const maskIllustration = this.scene.add.rectangle(this.textMaskLeft + this.textMaskWidth / 2, this.textMaskTop + this.textMaskHeight / 2, this.textMaskWidth, this.textMaskHeight);
            this.add(maskIllustration);
            maskIllustration.setStrokeStyle(4, 0x3236a8);
            maskIllustration.setFillStyle(0xa83281, 0.1);
        }
    }
    // @Override
    update(time, delta) {
        this.textArea.x -= this.rotationSpeedX * delta / 1000;
        this.textArea.y -= this.rotationSpeedY * delta / 1000;
        if (this.textArea.getBottomRight().y < this.textMaskTop) {
            this.textArea.y = this.textMaskTop + this.textMaskHeight;
        }
        if (this.textArea.getBottomRight().x < this.textMaskLeft) {
            this.textArea.x = this.textMaskLeft + this.textMaskWidth;
        }
    }
}
// A tile that bumps player up.
class TileForceJump extends TileMovingUp {
    // After touching these prefabs, this tile will disappear.
    setPushPrefabsUp(prefabs, speed = 100, 
    // Optionally use another sprite to show the "push up" effect.
    pushUpSpriteKey = '', pushUpSpriteFrame = 0) {
        this.setOverlapWith(prefabs, (self, other) => {
            let activated = false;
            const selfPos = this.getPosition();
            for (const prefab of prefabs) {
                const targetPos = prefab.getPosition();
                const relativeAngle = new Phaser.Math.Vector2(targetPos.x - selfPos.x, selfPos.y - targetPos.y).angle();
                if (relativeAngle > QMath.constants.PI_ONE_QUARTER &&
                    relativeAngle < QMath.constants.PI_THREE_QUARTER) {
                    prefab.applyVelocity(0, -speed, 'TileForceJump', CONST.INPUT.SMALL_TIME_INTERVAL_MS);
                    activated = true;
                }
            }
            if (pushUpSpriteKey && activated) {
                this.maybeActOnMainImg((img) => {
                    const pushupImg = this.scene.add.sprite(img.x, img.y, pushUpSpriteKey, pushUpSpriteFrame);
                    this.scene.add.tween({
                        targets: pushupImg,
                        y: img.y - img.height,
                        duration: 100,
                        loop: false,
                        yoyo: true,
                        onComplete: () => {
                            pushupImg.destroy();
                        },
                    });
                });
            }
        });
    }
}
// A tile that disappears after player touches it.
class TileSelfDestroy extends TileMovingUp {
    // After touching these prefabs, this tile will disappear.
    setDisappearAfterOverlappingWith(prefabs, delayMs = 1500) {
        this.setOverlapWith(prefabs, (self, other) => {
            this.scene.add.tween({
                targets: self,
                alpha: 0,
                duration: delayMs,
                loop: false,
                onComplete: () => {
                    this.destroy();
                }
            });
        });
    }
}
class StartScene extends Phaser.Scene {
    preload() {
        this.load.pack('root', 'assets/asset-pack.json');
    }
    create() {
        this.scene.start(GAME_CHOICE);
    }
}
class SceneJumpDownEnd extends QPhaser.Scene {
    lastScore = 0;
    init(data) {
        this.lastScore = data.score;
    }
    create() {
        const title = QUI.createTextTitle(this, [
            'You survived',
            `${this.lastScore.toFixed(1)} seconds!`,
        ], CONST.GAME_WIDTH / 2, 100);
        const congrats = this.add.image(CONST.GAME_WIDTH / 2, title.y + 150, 'goodjob');
        congrats.scale = 1.2;
        this.add.tween({
            targets: congrats,
            scale: 1.4,
            duration: 300,
            yoyo: true,
            loop: -1,
        });
        GLOBAL.bestScores.push(this.lastScore);
        // Sort without a sorting function somehow gives wired sort-by-string result.
        GLOBAL.bestScores.sort((a, b) => b - a);
        const scoreTexts = ['Best scores:'];
        let idx = 0;
        for (const score of GLOBAL.bestScores) {
            scoreTexts.push(`${idx + 1} -- ${score.toFixed(1)} sec`);
            idx++;
        }
        const rotatingText = new RotatingText(this, congrats.x - 100, congrats.y + 100, 200, 150);
        rotatingText.textArea?.setText(scoreTexts);
        rotatingText.textArea?.setFontSize(28);
        this.addPrefab(rotatingText);
        QUI.createButton(this, 'TRY AGAIN', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
            this.scene.start(SCENE_KEYS.JumpDownStart);
        });
        this.input.keyboard.once('keyup-ENTER', () => {
            this.scene.start(SCENE_KEYS.JumpDownMain);
        }, this);
    }
}
let DEBUG_SCENE;
class SceneJumpDownMain extends QPhaser.Scene {
    BLOCK_SPRITE_SIZE = 20;
    PLAYER_SIZE = 32;
    ITEM_SPRITE_SIZE = 16; // need to be smaller than block size.
    SPRITESHEET_KEY = 'tiles';
    // Tiles will be break into segments, each contains at this number of tiles,
    // each segment is a unit for special tile generation.
    TILE_GENERATION_SIZE = 4;
    // Use these parameters to change difficulty.
    platformMoveUpInitialSpeed = 30;
    platformMoveLeftRightRandomRange = 10;
    platformMoveLeftRightSpeedFactor = 30;
    // For platform spawn.
    // A new platform will be spawn randomly around 
    // delay = 120000 / current platform move up speed.
    platformSpawnDelayFactorMin = 90000;
    platformSpawnDelayFactorMax = 150000;
    platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
    platformSpawnWidthMax = CONST.GAME_WIDTH / 2;
    player;
    topBorder;
    bottomBorder;
    survivalTimeText;
    survivalTime = 0;
    // Multiplicative factor for platform move speed.
    platformSpeedFactor = new QLib.PrimitiveRef(1);
    // Last SetTimeout ID for spawning platform.
    lastSpawnPlatformTimeout = 0;
    playerData;
    init(playerData) {
        this.playerData = playerData;
    }
    create() {
        super.create();
        this.platformSpeedFactor.set(1.0);
        this.createBoundaries();
        this.createPlayer();
        this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, this.platformSpawnWidthMax, false, // no move left right
        false);
        this.createSurvivalTimer();
        this.startPlatformSpawnActions();
        DEBUG_SCENE = this;
    }
    update(totalTime, delta) {
        super.update(totalTime, delta);
        const time = this.timeSinceSceneStartMs / 1000;
        if (this.survivalTimeText) {
            this.survivalTimeText.setText(`${time.toFixed(1)}`);
            this.survivalTime = time;
        }
        // Make game harder over time.
        this.platformSpeedFactor.set(this.platformSpeedFactor.get() + delta / 20000);
    }
    createBoundaries() {
        const halfSpriteSize = this.BLOCK_SPRITE_SIZE / 2;
        for (let spikeIdx = 0; spikeIdx <= CONST.GAME_WIDTH / this.BLOCK_SPRITE_SIZE; spikeIdx++) {
            const x = spikeIdx * this.BLOCK_SPRITE_SIZE;
            const top = this.add.image(x, halfSpriteSize, 'tile_0068');
            top.setDepth(CONST.LAYERS.FRONT);
            top.setFlipY(true);
            const bottom = this.add.image(x, CONST.GAME_HEIGHT - halfSpriteSize, 'tile_0068');
            bottom.setDepth(CONST.LAYERS.FRONT);
        }
        const topBorder = this.add.rectangle(CONST.GAME_WIDTH / 2, 5, CONST.GAME_WIDTH, 10);
        this.physics.add.existing(topBorder, true);
        this.topBorder = topBorder;
        const bottomBorder = this.add.rectangle(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 5, CONST.GAME_WIDTH, 10);
        this.physics.add.existing(bottomBorder, true);
        this.bottomBorder = bottomBorder;
    }
    // Needs to be called after createSpikes.
    createPlayer() {
        let player;
        if (this.playerData.playerType === CONST.PLAYER_TYPE.ANIMATED) {
            player = new PlayerAnimatedSingleSheet(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.playerData);
        }
        else {
            player = new PlayerSingleSprite(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.playerData);
        }
        player.playerLeftRightSpeed = this.playerData.leftRightSpeed;
        player.playerLeftRightDashSpeed = this.playerData.leftRightDashSpeed;
        player.playerJumpSpeed = this.playerData.jumpSpeed;
        player.playerNumAllowedJumps = this.playerData.numAllowedJumps;
        this.addPrefab(player);
        player.maybeActOnMainImg((img) => {
            this.physics.add.overlap(img, [this.topBorder, this.bottomBorder], () => {
                this.gotoEndGame();
            });
        });
        this.player = player;
    }
    createSurvivalTimer() {
        const statusText = this.add.text(20, 10, 'Good luck!', {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '1.5em',
            color: '#8c085a',
            strokeThickness: 4,
            stroke: '#a8f7bd',
            align: 'center',
        });
        statusText.setFontSize(60);
        statusText.setDepth(CONST.LAYERS.TEXT);
        this.survivalTimeText = statusText;
    }
    startPlatformSpawnActions() {
        const currentSpeed = this.platformMoveUpInitialSpeed
            * this.platformSpeedFactor.get();
        this.lastSpawnPlatformTimeout = setTimeout(() => {
            this.spawnPlatform();
            this.startPlatformSpawnActions();
        }, Phaser.Math.FloatBetween(this.platformSpawnDelayFactorMin / currentSpeed, this.platformSpawnDelayFactorMax / currentSpeed));
    }
    // Spawn a new platform from bottom, needs to be called after createPlayer.
    spawnPlatform() {
        this.createPlatform(Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH), CONST.GAME_HEIGHT + 50, Phaser.Math.FloatBetween(this.platformSpawnWidthMin, this.platformSpawnWidthMax), 
        /*useSpecialTiles*/ true);
    }
    // Lowest level function to create a platform.
    createPlatform(x, y, width, canMoveLeftNRight = false, useSpecialTiles = true) {
        // First set up platform tiles.
        const platformShouldMove = canMoveLeftNRight && Phaser.Math.Between(1, 10) > 6;
        const platformMoveSpeed = Phaser.Math.Between(-this.platformMoveLeftRightRandomRange, this.platformMoveLeftRightRandomRange)
            * this.platformMoveLeftRightSpeedFactor;
        const numOfBlocks = Math.floor(width / this.BLOCK_SPRITE_SIZE);
        const tilePositions = [];
        for (let idx = 0; idx < numOfBlocks; idx++) {
            const blockX = x + (-numOfBlocks / 2 + idx) * this.BLOCK_SPRITE_SIZE;
            tilePositions.push({ x: blockX, y: y });
        }
        const tiles = [];
        for (let i = 0; i < tilePositions.length; i += this.TILE_GENERATION_SIZE) {
            for (const tile of this.createTilesForSegments(tilePositions.slice(i, i + this.TILE_GENERATION_SIZE), useSpecialTiles)) {
                tiles.push(tile);
            }
        }
        for (const tile of tiles) {
            this.addPrefab(tile);
            tile.setCollideWith([this.player]);
            tile.setOverlapWithGameObjects([this.topBorder], () => {
                tile.destroy();
            });
            tile.maybeActOnMainImg((img) => {
                if (platformShouldMove) {
                    img.setVelocityX(platformMoveSpeed);
                    this.add.tween({
                        targets: img.body.velocity,
                        x: -platformMoveSpeed,
                        duration: 1000,
                        yoyo: true,
                        loop: -1,
                    });
                }
            });
        }
        // Next setup items.
        const itemTypeRandomChoice = Phaser.Math.Between(1, 100);
        if (itemTypeRandomChoice < 10) {
            const tileChoice = tiles[Phaser.Math.Between(0, tiles.length - 1)];
            const { x, y } = tileChoice.getPosition();
            const item = new ItemAddTime(this, x, y - this.BLOCK_SPRITE_SIZE, this.SPRITESHEET_KEY, 896, this.ITEM_SPRITE_SIZE);
            item.setCollideWith(tiles);
            item.setOverlapWithGameObjects([this.topBorder], () => {
                item.destroy();
            });
            item.setEffect([this.player], (amountToAdd) => {
                this.timeSinceSceneStartMs += amountToAdd;
            });
            this.addPrefab(item);
        }
    }
    // A segment of tiles used together for creation of special tiles.
    // Each segment can only contain one type of special tiles.
    // Collisions with player and boundary are set in createPlatform.
    createTilesForSegments(tilePositions, useSpecialTiles = true) {
        const tiles = [];
        let choice = 100; // default to use normal tiles only.
        if (useSpecialTiles) {
            choice = Phaser.Math.Between(1, 100);
        }
        if (choice < 10) {
            // 1/10 chance to create auto disappearing tiles
            for (const pos of tilePositions) {
                const tile = new TileSelfDestroy(this, pos.x, pos.y, this.platformMoveUpInitialSpeed, this.platformSpeedFactor, this.SPRITESHEET_KEY, 3, this.BLOCK_SPRITE_SIZE);
                tile.setDisappearAfterOverlappingWith([this.player]);
                tiles.push(tile);
            }
        }
        else if (choice < 20) {
            // 1/10 chance to create jump tiles
            for (const pos of tilePositions) {
                const tile = new TileForceJump(this, pos.x, pos.y, this.platformMoveUpInitialSpeed, this.platformSpeedFactor, this.SPRITESHEET_KEY, 302, this.BLOCK_SPRITE_SIZE);
                tile.setPushPrefabsUp([this.player], 300, this.SPRITESHEET_KEY, 196);
                tiles.push(tile);
            }
        }
        else {
            for (const pos of tilePositions) {
                tiles.push(this.createNormalTile(pos.x, pos.y));
            }
        }
        return tiles;
    }
    createNormalTile(x, y) {
        return new TileMovingUp(this, x, y, this.platformMoveUpInitialSpeed, this.platformSpeedFactor, this.SPRITESHEET_KEY, 123, this.BLOCK_SPRITE_SIZE);
    }
    gotoEndGame() {
        clearTimeout(this.lastSpawnPlatformTimeout);
        this.scene.start(SCENE_KEYS.JumpDownEnd, {
            score: this.survivalTime,
        });
    }
}
class SceneJumpDownStart extends QPhaser.Scene {
    create() {
        const title = QUI.createTextTitle(this, [
            'Welcome to',
            'Falling Cato',
            'Survival Game!',
        ], CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 150, 50);
        const instruction = this.add.text(CONST.GAME_WIDTH / 2, title.y + 120, [
            'Choose your character',
            'and Good Luck!',
        ])
            .setOrigin(0.5)
            .setFontSize(24);
        const afterTextGap = 40;
        const gap = 40;
        const iconSize = CONST.GAME_WIDTH / 4;
        QUI.createIconButton(this, 'scared', 0, CONST.GAME_WIDTH / 4, instruction.y + afterTextGap + gap, // position
        iconSize, iconSize, // size
        () => {
            this.startNewGame({
                leftRightSpeed: 200,
                jumpSpeed: 300,
                numAllowedJumps: 1,
                playerType: CONST.PLAYER_TYPE.DEFAULT,
                size: 32,
                spriteKey: 'scared',
                spriteFrame: 0,
                facingLeft: true,
            });
        });
        QUI.createIconButton(this, 'pineapplecat', 0, CONST.GAME_WIDTH * 3 / 4, instruction.y + afterTextGap + gap, // position
        iconSize, iconSize, // size
        () => {
            this.startNewGame({
                leftRightSpeed: 120,
                jumpSpeed: 200,
                numAllowedJumps: 2,
                playerType: CONST.PLAYER_TYPE.DEFAULT,
                size: 48,
                spriteKey: 'pineapplecat',
                spriteFrame: 0,
                facingLeft: true,
            });
        });
        QUI.createIconButton(this, 'tilemap', 89, CONST.GAME_WIDTH * 1 / 4, instruction.y + afterTextGap + gap + iconSize + gap, // position
        iconSize, iconSize, // size
        () => {
            this.startNewGame({
                leftRightSpeed: 100,
                jumpSpeed: 100,
                numAllowedJumps: 400,
                playerType: CONST.PLAYER_TYPE.ANIMATED,
                size: 21,
                spritesheetKey: 'tilemap',
                spritesheetFacingLeft: false,
                frameRate: 10,
                frameStill: 79,
                frameRunStart: 80,
                frameRunEnd: 81,
                frameJumpStart: 86,
                frameJumpEnd: 87,
            });
        });
    }
    startNewGame(playerData) {
        this.scene.start(SCENE_KEYS.JumpDownMain, playerData);
    }
}
