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
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    });
    game.scene.add("Boot", Boot, true);
    game.scene.add("StartScene", StartScene);
    game.scene.add("JumpDown", SceneJumpDown);
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
    CONST.GAME_WIDTH = 1280;
    CONST.GAME_HEIGHT = 720;
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
const GAME_CHOICE = 'JumpDown';
;
// My enhancement on top of native Phaser objects.
var QPhaser;
(function (QPhaser) {
    // Wrapper extending a single `Matter.Image` object with common accessor for it.
    // Do not use this object's position etc., use the wrapped image directly.
    // The reason is to make it easier to add additional content to the container, helper API etc.
    class Prefab extends Phaser.GameObjects.Container {
        // The actual physical object.
        mainImage;
        // Manages infinite tweens on objects in this container.
        tweens = [];
        // Called when added to scene, use `Scene` object and you don't need to explicitly call this.
        // @Abstract
        init() { }
        // Update method, use the `Scene` object from this file and you don't need to explicitly call this.
        // @Abstract
        update(time, delta) {
            super.update(time, delta);
        }
        ;
        setMainImage(img) {
            this.mainImage = img;
        }
        // Calls action if `mainImage` is valid, otherwise it's an no-op.
        maybeActOnMainImage(action) {
            const img = this.getMainImage();
            if (img) {
                action(img);
            }
        }
        // You can set mainImage directly using the property; but use this function to read it.
        getMainImage() {
            if (!this.mainImage) {
                return undefined;
            }
            else if (!this.mainImage.active) {
                return undefined;
            }
            return this.mainImage;
        }
        // Use this to add and manage tween that never finishes.
        // Use `scene.tweens.add` etc. to directly add/remove temporary tweens.
        addInfiniteTween(tween) {
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
    QPhaser.Prefab = Prefab;
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
})(QPhaser || (QPhaser = {}));
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
// Helps to draw a hand from an array of 21 points.
// See: https://www.section.io/engineering-education/creating-a-hand-tracking-module/
class Hand extends QPhaser.Prefab {
    // Used to scale a hand.
    // Used to shift the hand.
    left = -CONST.GAME_WIDTH / 2;
    top = -CONST.GAME_HEIGHT / 2;
    // These are used to multiple the 0-1 values mediapipe reports, so if you use the image width
    // and height, you get the the positions on the image.
    handScaleX = CONST.GAME_WIDTH * 2;
    handScaleY = CONST.GAME_HEIGHT * 2;
    lineWidth = 4;
    strokeColor = 0x48f542;
    canvas;
    constructor(scene, left, top, handScaleX, handScaleY, lineWidth, strokeColor) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.left = left ?? this.left;
        this.top = top ?? this.top;
        this.handScaleX = handScaleX ?? this.handScaleX;
        this.handScaleY = handScaleY ?? this.handScaleY;
        this.lineWidth = lineWidth ?? this.lineWidth;
        this.strokeColor = strokeColor ?? this.strokeColor;
        // Note that it cannot be added to the container for some reason, otherwise it won't be displayed.
        const canvas = this.scene.add.graphics();
        this.canvas = canvas;
        // const tip = this.scene.matter.add.image(0, 0, 'Artboard');
        // this.add(tip);
        // tip.displayWidth = 50;
        // tip.displayHeight = 50;
        // tip.setCircle(30);
        // tip.setIgnoreGravity(true);
        // tip.setStatic(true);
        // this.setMainImage(tip);
    }
    // Values for points in locations are between 0-1.
    updateWithNewData(locations) {
        const pts = [];
        for (const l of locations) {
            pts.push({ x: this.left + l.x * this.handScaleX, y: this.top + l.y * this.handScaleY });
        }
        const c = this.canvas;
        c.clear();
        c.lineStyle(this.lineWidth, this.strokeColor);
        c.beginPath();
        // Thumb
        c.moveTo(pts[0].x, pts[0].y);
        c.lineTo(pts[1].x, pts[1].y);
        c.lineTo(pts[2].x, pts[2].y);
        c.lineTo(pts[3].x, pts[3].y);
        c.lineTo(pts[4].x, pts[4].y);
        // Index
        c.moveTo(pts[5].x, pts[5].y);
        c.lineTo(pts[6].x, pts[6].y);
        c.lineTo(pts[7].x, pts[7].y);
        c.lineTo(pts[8].x, pts[8].y);
        // Middle
        c.moveTo(pts[9].x, pts[9].y);
        c.lineTo(pts[10].x, pts[10].y);
        c.lineTo(pts[11].x, pts[11].y);
        c.lineTo(pts[12].x, pts[12].y);
        // Ring
        c.moveTo(pts[13].x, pts[13].y);
        c.lineTo(pts[14].x, pts[14].y);
        c.lineTo(pts[15].x, pts[15].y);
        c.lineTo(pts[16].x, pts[16].y);
        // Pinky
        c.moveTo(pts[17].x, pts[17].y);
        c.lineTo(pts[18].x, pts[18].y);
        c.lineTo(pts[19].x, pts[19].y);
        c.lineTo(pts[20].x, pts[20].y);
        // Palm
        c.moveTo(pts[0].x, pts[0].y);
        c.lineTo(pts[5].x, pts[5].y);
        c.lineTo(pts[9].x, pts[9].y);
        c.lineTo(pts[13].x, pts[13].y);
        c.lineTo(pts[17].x, pts[17].y);
        c.lineTo(pts[0].x, pts[0].y);
        c.strokePath();
        this.maybeActOnMainImage((img) => {
            img.setX(pts[8].x);
            img.setY(pts[8].y);
        });
    }
}
// Helps to draw a pose from an array of 33 points.
// See: https://google.github.io/mediapipe/solutions/pose.html
class Pose extends QPhaser.Prefab {
    // For shifting.
    sourceLeft = 0;
    sourceTop = 0;
    // For scaling.
    // These are used to multiple the 0-1 values mediapipe reports, so if you use the image width
    // and height, you get the the positions on the image.
    sourceWidth = CONST.GAME_WIDTH;
    sourceHeight = CONST.GAME_HEIGHT;
    lineWidth = 4;
    strokeColor = 0x48f542;
    canvas;
    constructor(scene, sourceLeft, sourceTop, // position of the source image in the world
    sourceWidth, sourceHeight, // dimention of the source image in the world
    lineWidth, strokeColor) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.sourceLeft = sourceLeft ?? this.sourceLeft;
        this.sourceTop = sourceTop ?? this.sourceTop;
        this.sourceWidth = sourceWidth ?? this.sourceWidth;
        this.sourceHeight = sourceHeight ?? this.sourceHeight;
        this.lineWidth = lineWidth ?? this.lineWidth;
        this.strokeColor = strokeColor ?? this.strokeColor;
        // Note that it cannot be added to the container for some reason, otherwise it won't be displayed.
        const canvas = this.scene.add.graphics();
        this.canvas = canvas;
    }
    // Values for points in locations are between 0-1.
    updateWithNewData(locations) {
        const pts = [];
        for (const l of locations) {
            pts.push({ x: this.sourceLeft + l.x * this.sourceWidth, y: this.sourceTop + l.y * this.sourceHeight });
        }
        const c = this.canvas;
        c.clear();
        c.lineStyle(this.lineWidth, this.strokeColor);
        c.beginPath();
        // Head
        c.moveTo(pts[6].x, pts[6].y);
        c.lineTo(pts[4].x, pts[4].y);
        c.lineTo(pts[0].x, pts[0].y);
        c.lineTo(pts[1].x, pts[1].y);
        c.lineTo(pts[3].x, pts[3].y);
        c.moveTo(pts[10].x, pts[10].y);
        c.lineTo(pts[9].x, pts[9].y);
        // const headRadius = new Phaser.Math.Vector2(pts[8].x - pts[0].x, pts[8].y - pts[0].y).length();
        // c.fillCircle(pts[0].x, pts[0].y, headRadius);
        // Left arm
        // const centerOfLeftHand = new Phaser.Math.Vector2(pts[16].x, pts[16].y);
        // centerOfLeftHand.add(pts[22]);
        // centerOfLeftHand.add(pts[20]);
        // centerOfLeftHand.add(pts[18]);
        // centerOfLeftHand.scale(0.25);
        c.moveTo(pts[12].x, pts[12].y);
        c.lineTo(pts[14].x, pts[14].y);
        c.lineTo(pts[16].x, pts[16].y);
        c.lineTo(pts[18].x, pts[18].y);
        c.lineTo(pts[20].x, pts[20].y);
        c.lineTo(pts[16].x, pts[16].y);
        // c.lineTo(centerOfLeftHand.x, centerOfLeftHand.y);
        // c.fillCircle(centerOfLeftHand.x, centerOfLeftHand.y, centerOfLeftHand.subtract(pts[16]).length());
        // Right arm
        // const centerOfRightHand = new Phaser.Math.Vector2(pts[15].x, pts[15].y);
        // centerOfRightHand.add(pts[21]);
        // centerOfRightHand.add(pts[17]);
        // centerOfRightHand.add(pts[19]);
        // centerOfRightHand.scale(0.25);
        c.moveTo(pts[11].x, pts[11].y);
        c.lineTo(pts[13].x, pts[13].y);
        c.lineTo(pts[15].x, pts[15].y);
        c.lineTo(pts[17].x, pts[17].y);
        c.lineTo(pts[19].x, pts[19].y);
        c.lineTo(pts[15].x, pts[15].y);
        // c.lineTo(centerOfRightHand.x, centerOfRightHand.y);
        // c.fillCircle(centerOfRightHand.x, centerOfRightHand.y, centerOfRightHand.subtract(pts[15]).length());
        // Torso
        c.moveTo(pts[12].x, pts[12].y);
        c.lineTo(pts[11].x, pts[11].y);
        c.lineTo(pts[23].x, pts[23].y);
        c.lineTo(pts[24].x, pts[24].y);
        c.lineTo(pts[12].x, pts[12].y);
        c.strokePath();
        this.maybeActOnMainImage((img) => {
            img.setX(pts[8].x);
            img.setY(pts[8].y);
        });
    }
}
// Helps to draw a pose from an array of 33 points.
// See: https://google.github.io/mediapipe/solutions/pose.html
class PoseTarget extends QPhaser.Prefab {
    HAND_SIZE = 100;
    HAND_MASS = 20;
    // For shifting.
    sourceLeft = 0;
    sourceTop = 0;
    // For scaling.
    // These are used to multiple the 0-1 values mediapipe reports, so if you use the image width
    // and height, you get the the positions on the image.
    sourceWidth = CONST.GAME_WIDTH;
    sourceHeight = CONST.GAME_HEIGHT;
    lineWidth = 4;
    strokeColor = 0x48f542;
    canvas;
    leftHand;
    rightHand;
    constructor(scene, sourceLeft, sourceTop, // position of the source image in the world
    sourceWidth, sourceHeight, // dimention of the source image in the world
    lineWidth, strokeColor) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.sourceLeft = sourceLeft ?? this.sourceLeft;
        this.sourceTop = sourceTop ?? this.sourceTop;
        this.sourceWidth = sourceWidth ?? this.sourceWidth;
        this.sourceHeight = sourceHeight ?? this.sourceHeight;
        this.lineWidth = lineWidth ?? this.lineWidth;
        this.strokeColor = strokeColor ?? this.strokeColor;
        // Note that it cannot be added to the container for some reason, otherwise it won't be displayed.
        const canvas = this.scene.add.graphics();
        this.canvas = canvas;
        const leftHand = this.scene.matter.add.image(0, 0, 'boxleft', 0, { ignoreGravity: true });
        this.add(leftHand);
        leftHand.displayWidth = this.HAND_SIZE;
        leftHand.displayHeight = this.HAND_SIZE;
        leftHand.setMass(this.HAND_MASS);
        this.leftHand = leftHand;
        const rightHand = this.scene.matter.add.image(0, 0, 'boxright', 0, { ignoreGravity: true });
        this.add(rightHand);
        rightHand.displayWidth = this.HAND_SIZE;
        rightHand.displayHeight = this.HAND_SIZE;
        rightHand.setMass(this.HAND_MASS);
        this.rightHand = rightHand;
    }
    // Values for points in locations are between 0-1.
    updateWithNewData(locations) {
        const pts = [];
        for (const l of locations) {
            pts.push({ x: this.sourceLeft + l.x * this.sourceWidth, y: this.sourceTop + l.y * this.sourceHeight });
        }
        const c = this.canvas;
        c.clear();
        c.lineStyle(this.lineWidth, this.strokeColor);
        c.beginPath();
        // Head
        c.moveTo(pts[6].x, pts[6].y);
        c.lineTo(pts[4].x, pts[4].y);
        c.lineTo(pts[0].x, pts[0].y);
        c.lineTo(pts[1].x, pts[1].y);
        c.lineTo(pts[3].x, pts[3].y);
        c.moveTo(pts[10].x, pts[10].y);
        c.lineTo(pts[9].x, pts[9].y);
        // const headRadius = new Phaser.Math.Vector2(pts[8].x - pts[0].x, pts[8].y - pts[0].y).length();
        // c.fillCircle(pts[0].x, pts[0].y, headRadius);
        // Left arm
        // const centerOfLeftHand = new Phaser.Math.Vector2(pts[16].x, pts[16].y);
        // centerOfLeftHand.add(pts[22]);
        // centerOfLeftHand.add(pts[20]);
        // centerOfLeftHand.add(pts[18]);
        // centerOfLeftHand.scale(0.25);
        c.moveTo(pts[12].x, pts[12].y);
        c.lineTo(pts[14].x, pts[14].y);
        c.lineTo(pts[16].x, pts[16].y);
        c.lineTo(pts[18].x, pts[18].y);
        c.lineTo(pts[20].x, pts[20].y);
        c.lineTo(pts[16].x, pts[16].y);
        const rh = this.rightHand;
        rh.setPosition(pts[16].x, pts[16].y);
        rh.setAngle(45);
        // c.lineTo(centerOfLeftHand.x, centerOfLeftHand.y);
        // c.fillCircle(centerOfLeftHand.x, centerOfLeftHand.y, centerOfLeftHand.subtract(pts[16]).length());
        // Right arm
        // const centerOfRightHand = new Phaser.Math.Vector2(pts[15].x, pts[15].y);
        // centerOfRightHand.add(pts[21]);
        // centerOfRightHand.add(pts[17]);
        // centerOfRightHand.add(pts[19]);
        // centerOfRightHand.scale(0.25);
        c.moveTo(pts[11].x, pts[11].y);
        c.lineTo(pts[13].x, pts[13].y);
        c.lineTo(pts[15].x, pts[15].y);
        c.lineTo(pts[17].x, pts[17].y);
        c.lineTo(pts[19].x, pts[19].y);
        c.lineTo(pts[15].x, pts[15].y);
        const lh = this.leftHand;
        lh.setPosition(pts[15].x, pts[15].y);
        lh.setAngle(45);
        // c.lineTo(centerOfRightHand.x, centerOfRightHand.y);
        // c.fillCircle(centerOfRightHand.x, centerOfRightHand.y, centerOfRightHand.subtract(pts[15]).length());
        // Torso
        c.moveTo(pts[12].x, pts[12].y);
        c.lineTo(pts[11].x, pts[11].y);
        c.lineTo(pts[23].x, pts[23].y);
        c.lineTo(pts[24].x, pts[24].y);
        c.lineTo(pts[12].x, pts[12].y);
        c.strokePath();
        this.maybeActOnMainImage((img) => {
            img.setX(pts[8].x);
            img.setY(pts[8].y);
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
class StartScene extends Phaser.Scene {
    preload() {
        this.load.pack('avatars-special', 'assets/asset-pack.json');
    }
    create() {
        this.scene.start(GAME_CHOICE);
        // this.scene.start("TestScene");
    }
}
class SceneJumpDown extends QPhaser.Scene {
    // Use these parameters to change difficulty.
    platformMoveUpSpeed = 30;
    playerLeftRightSpeed = 160;
    // For platform spawn.
    // A new platform will be spawn randomly with this delay.
    platformSpawnDelayMin = 2000;
    platformSpawnDelayMax = 5000;
    platformSpawnLengthFactorMin = 0.1;
    platformSpawnLengthFactorMax = 2;
    player;
    platforms = [];
    cursors;
    create() {
        // this.cameras.main.setViewport(CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH, CONST.GAME_HEIGHT);
        this.createPlayer();
        this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, 2).setVelocityY(-this.platformMoveUpSpeed);
        this.startPlatformSpawnActions();
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    update() {
        if (this.cursors) {
            this.handleInput(this.cursors);
        }
    }
    startPlatformSpawnActions() {
        const saveThis = this;
        setTimeout(function () {
            saveThis.spawnPlatform();
            saveThis.startPlatformSpawnActions();
        }, Phaser.Math.FloatBetween(this.platformSpawnDelayMin, this.platformSpawnDelayMax));
    }
    // Spawn a new platform from bottom.
    spawnPlatform() {
        const platform = this.createPlatform(Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH), CONST.GAME_HEIGHT + 50, Phaser.Math.FloatBetween(this.platformSpawnLengthFactorMin, this.platformSpawnLengthFactorMax));
        platform.setVelocityY(-this.platformMoveUpSpeed);
        return platform;
    }
    // Lowest level function to create a platform.
    createPlatform(x, y, widthScale) {
        const platform = this.physics.add.image(x, y, 'platform');
        platform.setScale(widthScale, 1);
        // Use setImmovable instead setPushable so it can give friction on player.
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        this.physics.add.collider(this.player, platform);
        this.platforms.push(platform);
        return platform;
    }
    createPlayer() {
        const player = this.physics.add.image(500, 200, 'dragon');
        player.setScale(0.5, 0.5);
        player.setCollideWorldBounds(true);
        player.setBounce(0);
        player.setFrictionX(1);
        this.player = player;
    }
    handleInput(cursors) {
        if (cursors.left.isDown) {
            this.player?.setVelocityX(-this.playerLeftRightSpeed);
            this.player?.setFlipX(false);
        }
        else if (cursors.right.isDown) {
            this.player?.setVelocityX(this.playerLeftRightSpeed);
            this.player?.setFlipX(true);
        }
        else {
            this.player?.setVelocityX(0);
        }
        if (cursors.up.isDown && this.player?.body.touching.down) {
            this.player?.setVelocityY(-330);
        }
    }
}
