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
const SCENE_KEYS = {
    JumpDownStart: 'JumpDownStart',
    JumpDownMain: 'JumpDownMain',
    JumpDownEnd: 'JumpDownEnd',
};
const GAME_CHOICE = 'JumpDownStart';
var GLOBAL;
(function (GLOBAL) {
    GLOBAL.bestScores = [];
})(GLOBAL || (GLOBAL = {}));
;
// My enhancement on top of native Phaser objects.
var QPhaser;
(function (QPhaser) {
    // Make it easier to maintain object container.
    class Prefab extends Phaser.GameObjects.Container {
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
    function createTextTitle(scene, content, x, y, fontSize) {
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
    }
}
class SceneJumpDownEnd extends QPhaser.Scene {
    lastScore = 0;
    init(data) {
        this.lastScore = data.score;
    }
    create() {
        const statusText = this.add.text(CONST.GAME_WIDTH / 2 - 400, CONST.GAME_HEIGHT / 2 - 250, [
            `You survived for ${this.lastScore.toFixed(1)} seconds !!!`,
            'Press "Y" to try again!',
        ], {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '1.5em',
            color: '#8c085a',
            strokeThickness: 4,
            stroke: '#a8f7bd',
            align: 'center',
        });
        statusText.setFontSize(60);
        const congrats = this.add.image(CONST.GAME_WIDTH / 2 - 200, statusText.y + 400, 'goodjob');
        congrats.scale = 2;
        this.add.tween({
            targets: congrats,
            scale: 2.5,
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
        const rotatingText = new RotatingText(this, congrats.x + 300, congrats.y - 140, 300, 300);
        rotatingText.textArea?.setText(scoreTexts);
        rotatingText.textArea?.setFontSize(40);
        this.addPrefab(rotatingText);
        this.input.keyboard.once('keyup-Y', () => {
            this.scene.start(SCENE_KEYS.JumpDownMain);
        }, this);
    }
}
class SceneJumpDownMain extends QPhaser.Scene {
    // Use these parameters to change difficulty.
    platformMoveUpSpeed = 30;
    playerLeftRightSpeed = 160;
    playerJumpSpeed = 350;
    playerFallSpeed = 100;
    // For platform spawn.
    // A new platform will be spawn randomly with this delay.
    platformSpawnDelayMin = 2500;
    platformSpawnDelayMax = 5000;
    platformSpawnLengthFactorMin = 0.1;
    platformSpawnLengthFactorMax = 2;
    player;
    spikes;
    topBorder;
    survivalTimeText;
    survivalTime = 0;
    cursors;
    keys = {};
    timer;
    create() {
        // this.cameras.main.setViewport(
        //   CONST.GAME_WIDTH / 2,
        //   CONST.GAME_WIDTH / 2,
        //   CONST.GAME_WIDTH,
        //   CONST.GAME_HEIGHT);
        this.createBoundaries();
        this.createPlayer();
        this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, 2)
            .setVelocityY(-this.platformMoveUpSpeed);
        this.createSurvivalTimer();
        this.startPlatformSpawnActions();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = QUI.createKeyMap(this);
        this.timer = this.time.addEvent({
            delay: 3600 * 1000,
            loop: true,
        });
    }
    update() {
        if (this.cursors) {
            this.handleInput(this.cursors);
        }
        const time = this.timer.getElapsedSeconds();
        if (this.survivalTimeText) {
            this.survivalTimeText.setText(`${time.toFixed(1)}`);
            this.survivalTime = time;
        }
    }
    createBoundaries() {
        const spikes = this.physics.add.staticGroup();
        const top = spikes.create(CONST.GAME_WIDTH / 2, 0, 'spike');
        // This makes the collision box to be shorter than the spike:
        //  - setDisplaySize changes collision box and the image
        //  - setSize only changes the collsion box
        //  - setSize needs to called first otherwise that causes a shift in X somehow.
        top.setSize(CONST.GAME_WIDTH, 120);
        top.setDisplaySize(CONST.GAME_WIDTH, 180);
        top.setDepth(CONST.LAYERS.FRONT);
        const bottom = spikes.create(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT, 'spike');
        bottom.setFlipY(true);
        bottom.setSize(CONST.GAME_WIDTH, 120);
        bottom.setDisplaySize(CONST.GAME_WIDTH, 180);
        // const top = this.physics.add.image(CONST.GAME_WIDTH / 2, 0, 'spike');
        // top.setImmovable(true);
        // This makes the collision box to be shorter than the spike:
        //  - setDisplaySize changes collision box and the image
        //  - setSize only changes the collsion box
        // top.setDisplaySize(CONST.GAME_WIDTH, 180);
        // top.setSize(CONST.GAME_WIDTH, 90);
        // top.body.allowGravity = false;
        spikes.setDepth(CONST.LAYERS.FRONT);
        this.spikes = spikes;
        const topBorder = this.add.rectangle(CONST.GAME_WIDTH / 2, 0, CONST.GAME_WIDTH, 20, 0x6666ff);
        this.physics.add.existing(topBorder, true);
        this.topBorder = topBorder;
    }
    // Needs to be called after createSpikes.
    createPlayer() {
        const player = this.physics.add.image(500, 200, 'scared');
        // player.setScale(0.5, 0.5);
        player.setDisplaySize(60, 60);
        player.setCollideWorldBounds(true);
        player.setBounce(0);
        player.setFrictionX(1);
        this.physics.add.overlap(player, this.spikes, () => {
            this.scene.start(SCENE_KEYS.JumpDownEnd, {
                score: this.survivalTime,
            });
        });
        // this.add.tween({
        //   targets: player,
        //   scale: 0.6,
        //   duration: 300,
        //   yoyo: true,
        //   loop: -1,
        // });
        this.player = player;
    }
    createSurvivalTimer() {
        const statusText = this.add.text(20, 100, 'Good luck!', {
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
        const saveThis = this;
        setTimeout(function () {
            if (saveThis.scene.manager.isActive(saveThis)) {
                saveThis.spawnPlatform();
                saveThis.startPlatformSpawnActions();
            }
        }, Phaser.Math.FloatBetween(this.platformSpawnDelayMin, this.platformSpawnDelayMax));
    }
    // Spawn a new platform from bottom, needs to be called after createPlayer.
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
        this.physics.add.overlap(platform, this.topBorder, () => {
            platform.destroy();
        });
        return platform;
    }
    handleInput(cursors) {
        if (this.keys.A.isDown || cursors.left.isDown) {
            this.player?.setVelocityX(-this.playerLeftRightSpeed);
            this.player?.setFlipX(false);
        }
        else if (this.keys.D.isDown || cursors.right.isDown) {
            this.player?.setVelocityX(this.playerLeftRightSpeed);
            this.player?.setFlipX(true);
        }
        else {
            this.player?.setVelocityX(0);
        }
        if ((this.keys.W.isDown || cursors.up.isDown)
            && this.player?.body.touching.down) {
            this.player?.setVelocityY(-this.playerJumpSpeed);
        }
        else if (this.keys.S.isDown || cursors.down.isDown) {
            this.player?.setVelocityY(this.playerFallSpeed);
        }
    }
}
class SceneJumpDownStart extends QPhaser.Scene {
    create() {
        QUI.createTextTitle(this, ['Welcome to Cato Survival Minigame!'], CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 250, 60);
        const congrats = this.add.image(CONST.GAME_WIDTH / 2, 350, 'fight');
        congrats.setDisplaySize(250, 250);
        congrats.setAngle(-20);
        this.add.tween({
            targets: congrats,
            angle: 20,
            duration: 400,
            yoyo: true,
            loop: -1,
        });
        QUI.createButton(this, 'Start game', CONST.GAME_WIDTH / 2, congrats.y + 200, () => {
            this.scene.start(SCENE_KEYS.JumpDownMain);
        });
    }
}
