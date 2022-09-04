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
    game.scene.add("EndGame", SceneEndGame);
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
var GLOBAL;
(function (GLOBAL) {
    bestScores: [0, 0, 0];
})(GLOBAL || (GLOBAL = {}));
;
// My enhancement on top of native Phaser objects.
var QPhaser;
(function (QPhaser) {
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
class StartScene extends Phaser.Scene {
    preload() {
        this.load.pack('avatars-special', 'assets/asset-pack.json');
    }
    create() {
        this.scene.start(GAME_CHOICE);
        // this.scene.start("TestScene");
    }
}
class SceneEndGame extends Phaser.Scene {
    score = 0;
    init(data) {
        this.score = data.score;
    }
    create() {
        const statusText = this.add.text(CONST.GAME_WIDTH / 2 - 400, CONST.GAME_HEIGHT / 2 - 250, `You survived for ${this.score} seconds !!!`, {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '1.5em',
            color: '#8c085a',
            strokeThickness: 4,
            stroke: '#a8f7bd',
            align: 'center',
        });
        statusText.setFontSize(60);
        const congrats = this.add.image(CONST.GAME_WIDTH / 2, 350, 'goodjob');
        congrats.scale = 2;
        this.add.tween({
            targets: congrats,
            scale: 2.5,
            duration: 300,
            yoyo: true,
            loop: -1,
        });
        // let viewerWithMostDamage = Object.keys(GLOBAL.mostDamage).reduce((a, b) => GLOBAL.mostDamage[a] > GLOBAL.mostDamage[b] ? a : b);
        // let viewerWithMostShots = Object.keys(GLOBAL.mostShots).reduce((a, b) => GLOBAL.mostShots[a] > GLOBAL.mostShots[b] ? a : b);
        // const statistics = this.add.text(
        //   300,
        //   500,
        //   [
        //     `${viewerWithMostDamage} did most (${GLOBAL.mostDamage[viewerWithMostDamage]}) damage!`,
        //     `${viewerWithMostShots} had most (${GLOBAL.mostShots[viewerWithMostShots]}) shots!`,
        //     `${GLOBAL.lastHitViewer} did the last shot!`,
        //   ],
        //   {
        //     fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        //     fontSize: '1.5em',
        //     color: '#a83248',
        //     strokeThickness: 4,
        //     stroke: '#a8f7bd',
        //     align: 'center',
        //   });
        // statistics.setFontSize(40);
        // const saveThis = this;
        // setTimeout(() => {
        //   saveThis.scene.stop('CongratsScene');
        // }, 10000);
    }
}
class SceneJumpDown extends Phaser.Scene {
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
    spikes;
    topBorder;
    survivalTimeText;
    survivalTime = 0;
    cursors;
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
    }
    update(time, delta) {
        if (this.cursors) {
            this.handleInput(this.cursors);
        }
        if (this.survivalTimeText) {
            this.survivalTimeText.setText(`${(time / 1000).toFixed(2)}`);
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
        const player = this.physics.add.image(500, 200, 'dragon');
        player.setScale(0.5, 0.5);
        player.setCollideWorldBounds(true);
        player.setBounce(0);
        player.setFrictionX(1);
        this.physics.add.overlap(player, this.spikes, () => {
            this.scene.start('EndGame', {
                score: (this.survivalTime / 1000).toFixed(2),
            });
        });
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
            console.log('destroyed');
            platform.destroy();
        });
        return platform;
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
