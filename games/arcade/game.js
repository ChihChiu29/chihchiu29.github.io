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
    CONST.CHANNELS = {
        SUPERCATO: 'supercatomeow',
    };
    CONST.FONT_STYLES = {
        GREENISH: function (font_size = '6em') {
            return {
                fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
                fontSize: font_size,
                color: '#2f2ffa',
                strokeThickness: 8,
                stroke: '#d5d5f0',
            };
        },
    };
})(CONST || (CONST = {}));
const TESTING = true;
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
})(GLOBAL || (GLOBAL = {}));
;
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
        applyVelocity(x, y, source = '', oncePerDurationMs = 0) {
            const lastActionTime = this.velocityLastActionTime.get(source);
            const now = QTime.now();
            if (!lastActionTime || now - lastActionTime > oncePerDurationMs) {
                this.velocityToBeAppliedX += x;
                this.velocityToBeAppliedY += y;
                this.needToApplyVelocity = true;
                this.velocityLastActionTime.set(source, now);
            }
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
    // Use `addPrefab` instead of `add.existing` when adding new `QPrefab` objects.
    class Scene extends Phaser.Scene {
        registeredPrefabs = new Set();
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
        // @Override
        update(time, delta) {
            super.update(time, delta);
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
})(QTime || (QTime = {}));
var QString;
(function (QString) {
    function stringContains(str, substring) {
        return str.indexOf(substring) >= 0;
    }
    QString.stringContains = stringContains;
})(QString || (QString = {}));
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
})(QUI || (QUI = {}));
var QMath;
(function (QMath) {
    QMath.constants = {
        PI_ONE_HALF: Math.PI / 2,
        PI_ONE_QUARTER: Math.PI / 4,
        PI_THREE_QUARTER: Math.PI * 3 / 4,
    };
})(QMath || (QMath = {}));
// Base class for arcade platform player.
// It is not directly useable.
// When subclassing this class, create elements in `init`.
// And performs necessary actions in `update`.
class ArcadePlayerBase extends QPhaser.ArcadePrefab {
    TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
    TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;
    playerLeftRightSpeed = 160;
    playerJumpSpeed = 250;
    playerFallSpeed = 100;
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
        if (moveLeft) {
            img.setVelocityX(-this.playerLeftRightSpeed);
            img.setFlipX(false);
        }
        else if (moveRight) {
            img.setVelocityX(this.playerLeftRightSpeed);
            img.setFlipX(true);
        }
        else {
            img.setVelocityX(0);
        }
        if (moveUp && img.body.touching.down) {
            // Only apply once per 200 ms.
            this.applyVelocity(0, -this.playerJumpSpeed, 'input', 200);
        }
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
// Base class for platform square tiles.
// It can be used to create a basic tile.
class PlatformTile extends QPhaser.ArcadePrefab {
    tileInitialSize = 0;
    spriteKey = '';
    frameIndex = 0;
    constructor(scene, imgInitialX, imgInitialY, spriteKey, frameIndex = 0, tileInitialSize = 20) {
        super(scene, imgInitialX, imgInitialY);
        this.tileInitialSize = tileInitialSize;
        this.spriteKey = spriteKey;
        this.frameIndex = frameIndex;
        const img = this.scene.physics.add.sprite(this.mainImgInitialX, this.mainImgInitialY, spriteKey, frameIndex);
        img.setImmovable(true);
        img.body.allowGravity = false;
        img.setDisplaySize(tileInitialSize, tileInitialSize);
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
    imageKey = '';
    imageInitialSize = 32;
    constructor(scene, imgInitialX, imgInitialY, imageKey = 'scared', imageInitialSize = 32) {
        super(scene, imgInitialX, imgInitialY);
        this.imageKey = imageKey;
        this.imageInitialSize = imageInitialSize;
    }
    init() {
        super.init();
        // Head.
        const headSprite = this.scene.physics.add.sprite(0, 0, this.imageKey);
        headSprite.setCollideWorldBounds(true);
        headSprite.setBounce(0);
        headSprite.setFrictionX(1);
        headSprite.setDisplaySize(this.imageInitialSize * 0.95, this.imageInitialSize * 0.95);
        this.setMainImage(headSprite);
        this.addInfiniteTween({
            targets: headSprite,
            displayWidth: this.imageInitialSize,
            displayHeight: this.imageInitialSize,
            duration: 200,
            yoyo: true,
            loop: -1,
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
class TileForceJump extends PlatformTile {
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
                    prefab.applyVelocity(0, -speed);
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
class TileSelfDestroy extends PlatformTile {
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
        this.load.pack('tiles', 'assets/tiles/asset-pack.json');
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
        rotatingText.textArea?.setFontSize(32);
        this.addPrefab(rotatingText);
        QUI.createButton(this, 'TRY AGAIN', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
            this.scene.start(SCENE_KEYS.JumpDownMain);
        });
        this.input.keyboard.once('keyup-ENTER', () => {
            this.scene.start(SCENE_KEYS.JumpDownMain);
        }, this);
    }
}
let DEBUG_SCENE;
class SceneJumpDownMain extends QPhaser.Scene {
    BLOCK_SPRITE_SIZE = 24;
    PLAYER_SIZE = 32;
    // Tiles will be break into segments, each contains at this number of tiles,
    // each segment is a unit for special tile generation.
    TILE_GENERATION_SIZE = 4;
    // Use these parameters to change difficulty.
    platformMoveUpInitialSpeed = 30;
    platformMoveUpSpeed = 0; // initialize in `create`.
    platformMoveLeftRightRandomRange = 10;
    platformMoveLeftRightSpeedFactor = 30;
    // For platform spawn.
    // A new platform will be spawn randomly around delay=120000/platformMoveUpSpeed.
    platformSpawnDelayFactorMin = 90000;
    platformSpawnDelayFactorMax = 150000;
    platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
    platformSpawnWidthMax = CONST.GAME_WIDTH / 2;
    player;
    topBorder;
    bottomBorder;
    survivalTimeText;
    survivalTime = 0;
    timer;
    // Last SetTimeout ID for spawning platform.
    lastSpawnPlatformTimeout = 0;
    create() {
        this.createBoundaries();
        this.createPlayer();
        this.platformMoveUpSpeed = this.platformMoveUpInitialSpeed;
        this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, this.platformSpawnWidthMax, this.platformMoveUpSpeed, false, // no move left right
        false);
        this.createSurvivalTimer();
        this.startPlatformSpawnActions();
        this.timer = this.time.addEvent({
            delay: 3600 * 1000,
            loop: true,
        });
        DEBUG_SCENE = this;
    }
    update(totalTime, delta) {
        super.update(totalTime, delta);
        const time = this.timer.getElapsedSeconds();
        if (this.survivalTimeText) {
            this.survivalTimeText.setText(`${time.toFixed(1)}`);
            this.survivalTime = time;
        }
        // Make game harder over time.
        this.platformMoveUpSpeed = this.platformMoveUpInitialSpeed + time * 0.8;
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
        // Makes player a bit smaller than sprite to make effects like falling through tiles easier.a
        const player = new PlayerSingleSprite(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, 'scared', this.PLAYER_SIZE);
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
        this.lastSpawnPlatformTimeout = setTimeout(() => {
            this.spawnPlatform();
            this.startPlatformSpawnActions();
        }, Phaser.Math.FloatBetween(this.platformSpawnDelayFactorMin / this.platformMoveUpSpeed, this.platformSpawnDelayFactorMax / this.platformMoveUpSpeed));
    }
    // Spawn a new platform from bottom, needs to be called after createPlayer.
    spawnPlatform() {
        this.createPlatform(Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH), CONST.GAME_HEIGHT + 50, Phaser.Math.FloatBetween(this.platformSpawnWidthMin, this.platformSpawnWidthMax), this.platformMoveUpSpeed, true);
    }
    // Lowest level function to create a platform.
    createPlatform(x, y, width, moveUpSpeed, canMoveLeftNRight = false, useSpecialTiles = true) {
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
                img.setVelocityY(-moveUpSpeed);
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
    }
    // A segment of tiles used together for creation of special tiles.
    // Each segment can only contain one type of special tiles.
    createTilesForSegments(tilePositions, useSpecialTiles = true) {
        const tiles = [];
        let choice = 100; // default to use normal tiles only.
        if (useSpecialTiles) {
            choice = Phaser.Math.Between(1, 100);
        }
        if (choice < 10) {
            // 1/10 chance to create auto disappearing tiles
            for (const pos of tilePositions) {
                const tile = new TileSelfDestroy(this, pos.x, pos.y, 'tiles', 3, this.BLOCK_SPRITE_SIZE);
                tile.setDisappearAfterOverlappingWith([this.player]);
                tiles.push(tile);
            }
        }
        else if (choice < 20) {
            // 1/10 chance to create jump tiles
            for (const pos of tilePositions) {
                const tile = new TileForceJump(this, pos.x, pos.y, 'tiles', 302, this.BLOCK_SPRITE_SIZE);
                tile.setPushPrefabsUp([this.player], 100, 'tiles', 196);
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
        return new PlatformTile(this, x, y, 'tiles', 123, this.BLOCK_SPRITE_SIZE);
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
            'Cato Survival',
            'Minigame!',
        ], CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 150, 50);
        const congrats = this.add.image(CONST.GAME_WIDTH / 2, title.y + 200, 'fight');
        congrats.setDisplaySize(200, 200);
        congrats.setAngle(-20);
        this.add.tween({
            targets: congrats,
            angle: 20,
            duration: 400,
            yoyo: true,
            loop: -1,
        });
        QUI.createButton(this, 'START', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
            this.startNewGame();
        });
        this.input.keyboard.once('keyup-ENTER', () => {
            this.startNewGame();
        }, this);
    }
    startNewGame() {
        this.scene.start(SCENE_KEYS.JumpDownMain);
    }
}
