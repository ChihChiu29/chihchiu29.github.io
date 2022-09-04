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
            default: 'matter',
            matter: {
                gravity: {
                    x: 0,
                    y: 0.2,
                },
                debug: TESTING,
            },
        },
        transparent: true,
        scale: {
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    });
    game.scene.add("Boot", Boot, true);
    game.scene.add("StartScene", StartScene);
    game.scene.add("Basketball", SceneBasketball);
    game.scene.add("Football", SceneFootball);
    game.scene.add("Soccer", SceneSoccer);
    game.scene.add("TestScene", TestScene);
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
const TESTING = false;
const GAME_CHOICE = 'Basketball';
// const GAME_CHOICE = 'Football';
// const GAME_CHOICE = 'Soccer';
var GLOBAL;
(function (GLOBAL) {
    GLOBAL.CATO_DRAWN_AVATARS = [];
})(GLOBAL || (GLOBAL = {}));
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
class Avatar extends QPhaser.Prefab {
    jump(magnitude) {
        throw new Error("Method not implemented.");
    }
    push(magnitude) {
        throw new Error("Method not implemented.");
    }
    rotate(magnitude) {
        throw new Error("Method not implemented.");
    }
    highlightSpeaking(content) {
        throw new Error("Method not implemented.");
    }
}
let DEBUG_SCENE;
// Base class for a Show scene, focus on viewer management.
// Some constants are not used by this class, but by subclasses.
class BaseShowScene extends QPhaser.Scene {
    NO_SHOW_USERS = new Set([
        'nightbot',
        'streamelements',
        'anotherttvviewer',
        'supercatobot',
        'supercatobot2',
    ]);
    // Special treatment for avatars for some users.
    AVATAR_SPECIAL_VIEWERS = {
        weljie_weljieshi: {
            imageKey: 'weljie',
            sizeFactor: 2.0,
        },
    };
    CUSTOM_REWARDS = {
        CHANGE_AVATAR: '9d18e435-c7df-4981-b8b3-ebf846b4baab',
        JUMP: '384deefc-c896-44c7-acb6-8edeab6e8612',
        PUSH_LEFT: 'd25a4223-7747-490f-892f-22f04f836ceb',
        PUSH_RIGHT: '263c8511-1097-47e1-8d93-9c99bc4e1331',
        ROLL_LEFT: 'f371a9d8-8cfb-4d9c-be6e-42a18a8756b6',
        ROLL_RIGHT: '65b338d9-411b-413c-9d05-08bb81069d7a', // squeeze
        // '!private_randomavatar_epic': 'c141b5c1-ce4c-408e-91fa-4b193f1ff5df',
    };
    CUSTOM_COMMAND_CHAR_SET = ['q', 'w', 'e', 'a', 's', 'd', 'x'];
    CAMERA_AREA_WIDTH = 320;
    CAMERA_AREA_HEIGHT = 440;
    ACTIVE_VIEWER_LIMIT = TESTING ? 400 : 30;
    INACTIVE_TIME_MS = TESTING ? 10 * 60 * 1000 : 30 * 60 * 1000; // 10 min
    AVATAR_SIZE = TESTING ? 40 : 60;
    AVATAR_SIZE_VARIATION_FACTOR = 0.2; // actual size is in the range +/- this factor times size
    AVATAR_MASS = 1;
    AVATAR_PUSH_STRENTH = 0.07;
    AVATAR_ROTATE_STRENTH = 0.05;
    AVATOR_JUMP_STRENTH = 0.05;
    AVATOR_BOUNCE_MIN = 0.1;
    AVATOR_BOUNCE_MAX = 0.3;
    AVATOR_FRICTION_MIX = 0.001;
    AVATOR_FRICTION_MAX = 0.1;
    // Viewer related properties are always key'ed by username.
    registeredViewers = new Map();
    activeViewers = new Map();
    // Helps to execute multiple user commands.
    cmdQueue = new QTime.SequenceActionThrottler(50);
    create() {
        DEBUG_SCENE = this;
        SceneFactory.createBoundary(this);
        this.matter.world.setBounds(0, 0, CONST.GAME_WIDTH, CONST.GAME_HEIGHT);
        const saveThis = this;
        this.time.addEvent({
            delay: TESTING ? 10 * 1000 : 60 * 1000,
            callback: () => { saveThis.removeInactiveViewers(); },
            loop: true,
        });
    }
    createTestViewer() {
        return this.activateViewer('test');
    }
    // Create or re-activate a viewer.
    activateViewer(name) {
        // First, registration.
        let viewer = this.registeredViewers.get(name);
        if (!viewer) {
            viewer = {
                username: name,
                lastActiveTimestamp: QTime.now(),
            };
            this.registeredViewers.set(name, viewer);
        }
        else {
            viewer.lastActiveTimestamp = QTime.now();
        }
        // Next, add it to active viewer.
        let viewerAvatar = this.activeViewers.get(name);
        if (viewerAvatar) {
            return viewerAvatar; // no need to update prefab.
        }
        else {
            let avatarImageKey;
            let sizeVariationFactor;
            if (this.AVATAR_SPECIAL_VIEWERS.hasOwnProperty(viewer.username)) {
                avatarImageKey = this.AVATAR_SPECIAL_VIEWERS[viewer.username].imageKey;
                sizeVariationFactor = this.AVATAR_SPECIAL_VIEWERS[viewer.username].sizeFactor;
            }
            else {
                avatarImageKey = Phaser.Math.RND.pick(GLOBAL.CATO_DRAWN_AVATARS);
                sizeVariationFactor = 1 + Phaser.Math.FloatBetween(-this.AVATAR_SIZE_VARIATION_FACTOR, this.AVATAR_SIZE_VARIATION_FACTOR);
            }
            const avatar = this.createNewAvatar(name, {
                imageKey: avatarImageKey,
                sizeFactor: sizeVariationFactor,
            });
            this.addPrefab(avatar);
            avatar.rotate(Phaser.Math.Between(-1, 1) * this.AVATAR_ROTATE_STRENTH);
            this.activeViewers.set(name, avatar);
            this.trimActiveViewers();
            return avatar;
        }
    }
    deactiveViewer(name, unregister = false) {
        let viewerAvatar = this.activeViewers.get(name);
        if (viewerAvatar) {
            this.destroyPrefab(viewerAvatar);
            this.activeViewers.delete(name);
        }
        if (unregister) {
            this.registeredViewers.delete(name);
        }
    }
    // Remove the inactive viewers in `activeViewers`.
    removeInactiveViewers() {
        const now = QTime.now();
        const shouldRemove = [];
        for (const username of this.activeViewers.keys()) {
            const viewer = this.registeredViewers.get(username);
            if (now - viewer.lastActiveTimestamp > this.INACTIVE_TIME_MS) {
                shouldRemove.push(username);
            }
        }
        for (const username of shouldRemove) {
            this.deactiveViewer(username);
        }
    }
    // Trim least active viewer from `activeViewer` if over capacity.
    trimActiveViewers() {
        if (this.activeViewers.size > this.ACTIVE_VIEWER_LIMIT) {
            const activeViewerNames = [...this.activeViewers.keys()];
            activeViewerNames.sort((v1, v2) => {
                return this.registeredViewers.get(v2).lastActiveTimestamp -
                    this.registeredViewers.get(v1).lastActiveTimestamp;
            });
            const shouldRemove = activeViewerNames.splice(this.ACTIVE_VIEWER_LIMIT);
            for (const username of shouldRemove) {
                this.deactiveViewer(username);
            }
        }
    }
    preload() {
        let saveThis = this;
        CHAT_LISTENER.startListening((who, rawMsg, msgArray, extraInfo) => {
            if (this.NO_SHOW_USERS.has(who)) {
                return;
            }
            // Add / renew viewer, highlight speaking icon.
            saveThis.activateViewer(who);
            const viewer = saveThis.activeViewers.get(who);
            viewer.highlightSpeaking(rawMsg);
            // Process command.
            if (extraInfo.rewardId) {
                saveThis.processSingleCommand(who, viewer, rawMsg, extraInfo);
            }
            else if (!QString.stringContains(rawMsg, ' ')) {
                let isValidCommand = true;
                for (const char of rawMsg) {
                    if (this.CUSTOM_COMMAND_CHAR_SET.indexOf(char) < 0) {
                        isValidCommand = false;
                        break;
                    }
                }
                if (isValidCommand) {
                    for (const cmdMsg of rawMsg) {
                        if (cmdMsg === 'x') {
                            for (let i = 0; i < 10; i++) {
                                saveThis.cmdQueue.enqueue(() => {
                                    saveThis.processSingleCommand(who, viewer, 'WAIT', extraInfo);
                                });
                            }
                        }
                        else {
                            saveThis.cmdQueue.enqueue(() => {
                                saveThis.processSingleCommand(who, viewer, cmdMsg, extraInfo);
                            });
                        }
                    }
                }
            }
        });
    }
    processSingleCommand(who, viewer, cmdMsg, extraInfo) {
        if (extraInfo.rewardId) {
            const cmd = extraInfo.rewardId;
            if (cmd === this.CUSTOM_REWARDS.CHANGE_AVATAR) {
                this.deactiveViewer(who, true);
                this.activateViewer(who);
            }
            else if (cmd === this.CUSTOM_REWARDS.JUMP) {
                viewer.jump(this.AVATOR_JUMP_STRENTH);
            }
            else if (cmd === this.CUSTOM_REWARDS.PUSH_LEFT) {
                viewer.push(-this.AVATAR_PUSH_STRENTH);
            }
            else if (cmd === this.CUSTOM_REWARDS.PUSH_RIGHT) {
                viewer.push(this.AVATAR_PUSH_STRENTH);
            }
            else if (cmd === this.CUSTOM_REWARDS.ROLL_LEFT) {
                viewer.rotate(-this.AVATAR_ROTATE_STRENTH);
            }
            else if (cmd === this.CUSTOM_REWARDS.ROLL_RIGHT) {
                viewer.rotate(this.AVATAR_ROTATE_STRENTH);
            }
        }
        else {
            if (cmdMsg === 'w') {
                viewer.jump(this.AVATOR_JUMP_STRENTH);
            }
            else if (cmdMsg === 's') {
                viewer.jump(-this.AVATOR_JUMP_STRENTH);
            }
            else if (cmdMsg === 'a') {
                viewer.push(-this.AVATAR_PUSH_STRENTH);
            }
            else if (cmdMsg === 'd') {
                viewer.push(this.AVATAR_PUSH_STRENTH);
            }
            else if (cmdMsg === 'q') {
                viewer.rotate(-this.AVATAR_ROTATE_STRENTH);
            }
            else if (cmdMsg === 'e') {
                viewer.rotate(this.AVATAR_ROTATE_STRENTH);
            }
            else if (cmdMsg === 'WAIT') {
                // wait
            }
        }
    }
}
var CHAT_LISTENER = {
    RETRY_INTERVAL_SEC: 30 * 1000,
    // Starts a new listener to new non-empty messages.
    // Check details from `chat_listener_server.js`.
    startListening: function (listenerCallback) {
        let ws = new WebSocket('ws://localhost:8187');
        ws.onmessage = function (rawEvent) {
            let event = JSON.parse(rawEvent.data);
            const msgArray = event.msg.split(' ').filter((x) => x);
            if (!msgArray.length) {
                return;
            }
            console.log(`${event.who}: ${event.msg}, ${msgArray}, ${JSON.stringify(event.extraInfo)}`);
            listenerCallback(event.who, event.msg, msgArray, event.extraInfo);
        };
        ws.onopen = function () {
            console.log('connected!');
        };
        ws.onerror = function (err) {
            // No need to call start listening since `onclose` will be called after `onerror` when server is closed.
            console.log(err);
        };
        ws.onclose = function () {
            console.log('closed!');
            CHAT_LISTENER.startListening(listenerCallback);
        };
    }
};
;
class AvatarCar extends Avatar {
    BUBBLING_EFFECT_FACTOR = 1.05;
    BUBBLING_EFFECT_SPEED_MS = 200;
    CHAT_FLASHING_SPEED_MS = 400;
    CHAT_FLASHING_REPEAT = 10;
    CAR_HEIGHT_WIDTH_RATIO = 0.9;
    CAR_BASE_SIZE_SLOPE_RATIO = 0.2;
    CAR_TOP_SHRINK_RATIO = 0.3;
    CAR_TOP_HEIGHT_RATIO = 0.2; // compared to base
    imageKey = '';
    owner = '';
    // Who this avatar represents.
    nameTag;
    // Shown when the user typed a message.
    chatIndicator;
    chatIndicatorTween = new QPhaser.SingletonTween();
    // private chatIndicatorTween?: Phaser.Tweens.Tween;
    avatarSize = 0;
    // Center and width/height of the shooting target spirte, 
    // the actual size is bigger because of other elements.
    constructor(scene, imageKey, avatarSize, owner) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.imageKey = imageKey;
        this.avatarSize = avatarSize;
        this.owner = owner;
        this.createAvatar();
        this.createOtherUiElements();
    }
    // @Override
    update(time, delta) {
        super.update(time, delta);
        this.updateOtherUiElements();
    }
    // Push right/left with positive/negative magnitude.
    push(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForce(new Phaser.Math.Vector2(magnitude, 0));
        });
    }
    // Rotate (counter-)clockwisely with (negative-)magnitude.
    rotate(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForceFrom(new Phaser.Math.Vector2(img.x, img.y - this.avatarSize / 2), new Phaser.Math.Vector2(magnitude, 0));
        });
    }
    highlightSpeaking(content) {
        this.chatIndicator.alpha = 0;
        this.chatIndicatorTween.update(this.scene.add.tween({
            targets: this.chatIndicator,
            alpha: 1,
            duration: this.BUBBLING_EFFECT_SPEED_MS,
            yoyo: true,
            loop: 5,
        }));
    }
    jump(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForce(new Phaser.Math.Vector2(0, -magnitude));
        });
    }
    createAvatar() {
        // const avatar = this.scene.matter.add.image(400, 100, this.imageKey, undefined, {
        //   // @ts-ignore
        //   shape: {
        //     type: 'fromVerts', verts: [
        //       [{ "x": 99, "y": 79 }, { "x": 77, "y": 118 }, { "x": 124, "y": 118 }]
        //     ],
        //   },
        //   render: { sprite: { xOffset: 0.30, yOffset: 0.15 } }
        // });
        const avatar = this.scene.matter.add.image(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.imageKey);
        this.add(avatar);
        avatar.displayWidth = this.avatarSize;
        avatar.displayHeight = this.avatarSize * this.CAR_HEIGHT_WIDTH_RATIO;
        // https://github.com/photonstorm/phaser3-docs/issues/31
        // @ts-ignore: Property 'Matter' does not exist on type 'typeof Matter'.
        var Bodies = Phaser.Physics.Matter.Matter.Bodies;
        const carBaseHeight = this.avatarSize * this.CAR_HEIGHT_WIDTH_RATIO;
        const carBaseSlope = this.avatarSize * this.CAR_BASE_SIZE_SLOPE_RATIO;
        const carBaseTopSizeShrinkValue = this.avatarSize * this.CAR_TOP_SHRINK_RATIO;
        const carTopPartHeight = this.avatarSize / 2 * this.CAR_TOP_HEIGHT_RATIO;
        avatar.setExistingBody(Bodies.fromVertices(0, 0, [
            // Center of mass will be matched to reference of the image.
            // Base
            [
                { "x": 0, "y": carBaseHeight },
                { "x": carBaseSlope, "y": 0 },
                // { "x": carBaseTopSizeShrinkValue, "y": 0 },
                // { "x": carBaseTopSizeShrinkValue, "y": -carTopPartHeight },
                // { "x": this.avatarSize - carBaseTopSizeShrinkValue, "y": -carTopPartHeight },
                // { "x": this.avatarSize - carBaseTopSizeShrinkValue, "y": 0 },
                { "x": this.avatarSize - carBaseSlope, "y": 0 },
                { "x": this.avatarSize, "y": carBaseHeight },
            ],
        ]));
        // avatar.setExistingBody(Bodies.fromVertices(0, 0, '0 0 100 100 0 100'), true);
        avatar.setBounce(Phaser.Math.FloatBetween(0.5, 0.99));
        avatar.setFriction(0.01);
        avatar.setFrictionAir(0);
        avatar.setFrictionStatic(0.01);
        // this.addInfiniteTween({
        //   targets: avatar,
        //   displayWidth: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
        //   displayHeight: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
        //   duration: this.BUBBLING_EFFECT_SPEED_MS,
        //   yoyo: true,
        //   loop: -1,
        // });
        this.setMainImage(avatar);
    }
    createOtherUiElements() {
        const nameTag = this.scene.add.text(0, 0, this.owner, {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '1em',
            color: '#8c085a',
            strokeThickness: 4,
            stroke: '#a8f7bd',
            align: 'center',
        });
        this.add(nameTag);
        this.nameTag = nameTag;
        const chatIndicator = this.scene.add.image(0, 0, 'chat');
        this.add(chatIndicator);
        chatIndicator.setDisplaySize(this.avatarSize, this.avatarSize);
        chatIndicator.setAlpha(0);
        this.chatIndicator = chatIndicator;
    }
    updateOtherUiElements() {
        this.maybeActOnMainImage((img) => {
            this.nameTag.setPosition(img.x - this.avatarSize / 2, img.y - this.avatarSize * 0.8);
            if (this.chatIndicator) {
                this.chatIndicator.setPosition(img.x + this.avatarSize / 3, img.y - this.avatarSize);
            }
        });
    }
}
class AvatarRound extends Avatar {
    BUBBLING_EFFECT_FACTOR = 1.05;
    BUBBLING_EFFECT_SPEED_MS = 200;
    CHAT_FLASHING_SPEED_MS = 400;
    CHAT_FLASHING_REPEAT = 10;
    imageKey = '';
    owner = '';
    // Who this avatar represents.
    nameTag;
    // Shown when the user typed a message.
    chatIndicator;
    chatIndicatorTween = new QPhaser.SingletonTween();
    // private chatIndicatorTween?: Phaser.Tweens.Tween;
    avatarSize = 0;
    // Center and width/height of the shooting target spirte, the actual size is bigger because of other elements.
    constructor(scene, imageKey, avatarSize, owner) {
        // Use world coordinates.
        super(scene, 0, 0);
        this.imageKey = imageKey;
        this.avatarSize = avatarSize;
        this.owner = owner;
        this.createAvatar();
        this.createOtherUiElements();
    }
    // @Override
    update(time, delta) {
        super.update(time, delta);
        this.updateOtherUiElements();
    }
    // Push right/left with positive/negative magnitude.
    push(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForce(new Phaser.Math.Vector2(magnitude, 0));
        });
    }
    // Rotate (counter-)clockwisely with (negative-)magnitude.
    rotate(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForceFrom(new Phaser.Math.Vector2(img.x, img.y - this.avatarSize / 2), new Phaser.Math.Vector2(magnitude, 0));
        });
    }
    highlightSpeaking(content) {
        this.chatIndicator.alpha = 0;
        this.chatIndicatorTween.update(this.scene.add.tween({
            targets: this.chatIndicator,
            alpha: 1,
            duration: this.BUBBLING_EFFECT_SPEED_MS,
            yoyo: true,
            loop: 5,
        }));
    }
    jump(magnitude) {
        this.maybeActOnMainImage((img) => {
            img.applyForce(new Phaser.Math.Vector2(0, -magnitude));
        });
    }
    createAvatar() {
        const avatar = this.scene.matter.add.image(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.imageKey);
        this.add(avatar);
        avatar.setDepth(-1);
        avatar.displayWidth = this.avatarSize;
        avatar.displayHeight = this.avatarSize;
        avatar.setCircle(this.avatarSize * 0.5);
        avatar.setFrictionAir(0);
        this.addInfiniteTween({
            targets: avatar,
            displayWidth: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
            displayHeight: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
            duration: this.BUBBLING_EFFECT_SPEED_MS,
            yoyo: true,
            loop: -1,
        });
        this.setMainImage(avatar);
    }
    createOtherUiElements() {
        const nameTag = this.scene.add.text(0, 0, this.owner, {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '1em',
            color: '#8c085a',
            strokeThickness: 4,
            stroke: '#a8f7bd',
            align: 'center',
        });
        this.add(nameTag);
        this.nameTag = nameTag;
        const chatIndicator = this.scene.add.image(0, 0, 'chat');
        this.add(chatIndicator);
        // chatIndicator.setDisplaySize(this.avatarSize / 2, this.avatarSize / 2);
        chatIndicator.setDisplaySize(this.avatarSize, this.avatarSize);
        chatIndicator.setAlpha(0);
        this.chatIndicator = chatIndicator;
    }
    updateOtherUiElements() {
        this.maybeActOnMainImage((img) => {
            this.nameTag.setPosition(img.x - this.avatarSize / 2, img.y - this.avatarSize * 0.8);
            if (this.chatIndicator) {
                // this.chatIndicator!.setPosition(img.x + this.avatarSize * 2 / 3, img.y - this.avatarSize / 2);
                this.chatIndicator.setPosition(img.x + this.avatarSize / 3, img.y - this.avatarSize);
            }
        });
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
var SceneFactory;
(function (SceneFactory) {
    // Creates physical boundary around the game area.
    function createBoundary(scene) {
        const halfWidth = CONST.GAME_WIDTH / 2;
        const halfHeight = CONST.GAME_HEIGHT / 2;
        // top
        scene.matter.add.rectangle(halfWidth, -halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
        // bottom
        scene.matter.add.rectangle(halfWidth, CONST.GAME_HEIGHT + halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
        // left
        scene.matter.add.rectangle(-halfWidth, halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
        // right
        scene.matter.add.rectangle(CONST.GAME_WIDTH + halfWidth, halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
        // Extra bump at bottom left for camera location.
        // scene.matter.add.fromVertices(160, 720 - 420 / 2, '0 0 320 30 320 420 0 420', { ignoreGravity: true, isStatic: true });
    }
    SceneFactory.createBoundary = createBoundary;
})(SceneFactory || (SceneFactory = {}));
class StartScene extends Phaser.Scene {
    RES_AVATARS_KEY = 'avatars';
    preload() {
        this.load.pack(this.RES_AVATARS_KEY, 'assets/avatars.json');
        this.load.pack('avatars-special', 'assets/avatarsspecial.json');
        this.load.pack('other-images', 'assets/others.json');
    }
    create() {
        this.matter.world.setBounds(0, 0, CONST.GAME_WIDTH, CONST.GAME_HEIGHT);
        // Fill in global states.
        // Gather all avatars (except special ones).
        for (const f of this.cache.json.entries.entries[this.RES_AVATARS_KEY]['section1'].files) {
            GLOBAL.CATO_DRAWN_AVATARS.push(f.key);
        }
        this.scene.start(GAME_CHOICE);
        // this.scene.start("TestScene");
    }
}
// You can write more code here
/* START OF COMPILED CODE */
class TestScene extends QPhaser.Scene {
    editorCreate() {
        // chatPopup
        const chatPopup = new ChatPopup(this, 100, 100, 200, 100);
        this.add.existing(chatPopup);
        const chatPopup1 = new ChatPopup(this, 100, 300, 200, 100, ["yaya"], true);
        this.add.existing(chatPopup1);
        SceneFactory.createBoundary(this);
        this.events.emit("scene-awake");
    }
    /* START-USER-CODE */
    // Write your code here
    create() {
        for (let x = 100; x < 2000; x += 100) {
            for (let y = 100; y < 2000; y += 100) {
                this.add.line(x, y, 0, 0, 1000, 0, 0xa8325e);
                this.add.line(x, y, 0, 0, 0, 1000, 0xa8325e);
            }
        }
        this.editorCreate();
    }
}
/* END OF COMPILED CODE */
// You can write more code here
class SceneBasketball extends BaseShowScene {
    // Shooting target related.
    SCORE_VELOCITY = 0.1; // going down
    // Shooting target related.
    // Location should match camera location.
    TARGET_X = this.CAMERA_AREA_WIDTH;
    TARGET_Y = 440;
    targetHitDetection;
    ball;
    lastHitViewer = '';
    // +1 text.
    plusOneText;
    plusOneTextTween = new QPhaser.SingletonTween();
    // Score bulletin.
    scoreBulletin;
    scores = new Map();
    create() {
        super.create();
        this.createTargetRelatedUiElements();
        const saveThis = this;
        // TEST
        if (TESTING) {
            this.time.addEvent({
                delay: 10,
                callback: () => { saveThis.activateViewer(Phaser.Math.Between(1, 2000).toString()); },
                // loop: true,
                repeat: 10,
            });
        }
    }
    createTargetRelatedUiElements() {
        const hoopImage = this.add.image(this.TARGET_X + 72, this.TARGET_Y, 'hoop');
        hoopImage.displayWidth = 180;
        hoopImage.displayHeight = 180;
        hoopImage.setDepth(CONST.LAYERS.FRONT);
        // Left blocker for the hoop.
        this.matter.add.rectangle(this.TARGET_X + 30, this.TARGET_Y - 2, 40, 10, { ignoreGravity: true, isStatic: true });
        // Right blocker for the hoop.
        // this.matter.add.rectangle(this.TARGET_X + 140, this.TARGET_Y, 10, 10, { ignoreGravity: true, isStatic: true });
        this.matter.add.circle(this.TARGET_X + 150, this.TARGET_Y - 2, 8, { ignoreGravity: true, isStatic: true });
        // Slant area below the hoop to prevent shooting up.
        this.matter.add.trapezoid(this.TARGET_X, 600, 200, 360, 1, { ignoreGravity: true, isStatic: true });
        // Camera area.
        this.matter.add.rectangle(this.CAMERA_AREA_WIDTH / 2, CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT / 2, this.CAMERA_AREA_WIDTH, this.CAMERA_AREA_HEIGHT, { ignoreGravity: true, isStatic: true });
        // "+1" text.
        const plusOneText = this.add.text(this.TARGET_X + 60, this.TARGET_Y - 80, '+1', {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
            fontSize: '6em',
            color: '#2f2ffa',
            strokeThickness: 8,
            stroke: '#d5d5f0',
        });
        plusOneText.setDepth(CONST.LAYERS.FRONT);
        plusOneText.setAlpha(0);
        this.plusOneText = plusOneText;
        const hitDetection = this.matter.add.rectangle(this.TARGET_X + 100, this.TARGET_Y + 20, 60, 10, { ignoreGravity: true, isStatic: true, isSensor: true });
        this.targetHitDetection = hitDetection;
        const bulletin = new RotatingText(this, 0, 200, this.CAMERA_AREA_WIDTH, 100);
        this.addPrefab(bulletin);
        bulletin.setDepth(CONST.LAYERS.FRONT);
        bulletin.textArea?.setDepth(CONST.LAYERS.FRONT);
        bulletin.rotationSpeedY = 30;
        bulletin.textArea?.setText('Play Basketball with Cato');
        this.scoreBulletin = bulletin;
    }
    // @Implement
    createNewAvatar(viewerName, viewerAvatarConfig) {
        const avatar = new AvatarRound(this, viewerAvatarConfig.imageKey, this.AVATAR_SIZE * viewerAvatarConfig.sizeFactor, viewerName);
        const saveThis = this;
        avatar.maybeActOnMainImage((img) => {
            img.x = Phaser.Math.Between(img.displayWidth, CONST.GAME_WIDTH - img.displayWidth);
            // img.x = Phaser.Math.Between(this.CAMERA_AREA_WIDTH + img.displayWidth, CONST.GAME_WIDTH - img.displayWidth);
            img.y = img.displayHeight;
            img.setMass(this.AVATAR_MASS * viewerAvatarConfig.sizeFactor);
            img.setBounce(Phaser.Math.FloatBetween(this.AVATOR_BOUNCE_MIN, this.AVATOR_BOUNCE_MAX));
            const friction = Phaser.Math.FloatBetween(this.AVATOR_FRICTION_MIX, this.AVATOR_FRICTION_MAX);
            img.setFriction(friction);
            img.setFrictionStatic(friction);
            img.setOnCollideWith(saveThis.targetHitDetection, () => {
                if (img.body.velocity.y > this.SCORE_VELOCITY) {
                    const value = this.scores.get(viewerName);
                    if (value) {
                        this.scores.set(viewerName, value + 1);
                    }
                    else {
                        this.scores.set(viewerName, 1);
                    }
                    saveThis.updateScoreBoard();
                    this.plusOneText.alpha = 0;
                    this.plusOneTextTween.update(saveThis.add.tween({
                        targets: saveThis.plusOneText,
                        alpha: 1,
                        duration: 500,
                        yoyo: true,
                        loop: 0,
                    }));
                }
            });
        });
        avatar.rotate(Phaser.Math.Between(-1, 1) * this.AVATAR_ROTATE_STRENTH);
        return avatar;
    }
    updateScoreBoard() {
        const topScorers = [...this.scores.keys()];
        topScorers.sort((v1, v2) => { return this.scores.get(v2) - this.scores.get(v1); });
        const messages = ['Cato Game Leaderboard'];
        let idx = 0;
        for (const scorer of topScorers) {
            messages.push(`${idx + 1}. ${scorer}: ${this.scores.get(scorer)}`);
            idx++;
        }
        this.scoreBulletin?.textArea?.setText(messages);
    }
}
class SceneFootball extends BaseShowScene {
    // Avatar speed needs to be greater than this value for a touch event be considered
    // as a control.
    AVATAR_MINIMAL_CONTROL_VELOCITY = 2;
    // Shooting target related.
    // Location should match camera location.
    TARGET_X = this.CAMERA_AREA_WIDTH;
    TARGET_Y = CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT;
    targetHitDetection;
    ball;
    lastHitViewer = '';
    // +1 text.
    plusOneText;
    plusOneTextTween = new QPhaser.SingletonTween();
    // Score bulletin.
    scoreBulletin;
    scores = new Map();
    // Who has the ball text.
    whoHasBallText;
    // Ball reset related.
    resetBallTimeout = new QTime.AutoClearedTimeout();
    create() {
        super.create();
        this.createTargetRelatedUiElements();
        const saveThis = this;
        // TEST
        if (TESTING) {
            this.time.addEvent({
                delay: 10,
                callback: () => { saveThis.activateViewer(Phaser.Math.Between(1, 2000).toString()); },
                // loop: true,
                repeat: 10,
            });
        }
    }
    createTargetRelatedUiElements() {
        // Shooting target.
        const goalPoleImage = this.add.image(this.TARGET_X - 40, this.TARGET_Y - 60, 'footballpole');
        goalPoleImage.setFlipX(true);
        goalPoleImage.displayWidth = 60;
        goalPoleImage.displayHeight = 160;
        goalPoleImage.setDepth(CONST.LAYERS.FRONT);
        // Slant area to make sure ball can come out.
        this.matter.add.trapezoid(this.TARGET_X - 80, this.TARGET_Y + 15, 160, 10, 1, { ignoreGravity: true, isStatic: true });
        const hitDetection = this.matter.add.rectangle(this.TARGET_X - 40, this.TARGET_Y - 80, 40, 80, { ignoreGravity: true, isStatic: true, isSensor: true });
        this.targetHitDetection = hitDetection;
        // Ball.
        const ballImage = this.matter.add.image(CONST.GAME_WIDTH / 2, this.TARGET_Y, 'football');
        ballImage.displayWidth = this.AVATAR_SIZE;
        ballImage.displayHeight = this.AVATAR_SIZE;
        ballImage.setCircle(this.AVATAR_SIZE * 0.5);
        // Set height second time after setting body to squeeze body shape as well.
        ballImage.displayHeight = this.AVATAR_SIZE / 2;
        ballImage.setMass(0.1);
        ballImage.setFriction(0.9);
        ballImage.setFrictionAir(0);
        ballImage.setFrictionStatic(0.9);
        ballImage.setBounce(0.8);
        this.ball = ballImage;
        // "+1" text.
        const plusOneText = this.add.text(this.TARGET_X + 60, this.TARGET_Y - 80, '+1', CONST.FONT_STYLES.GREENISH());
        plusOneText.setDepth(CONST.LAYERS.TEXT);
        plusOneText.setAlpha(0);
        this.plusOneText = plusOneText;
        // Update score when ball hits the target.
        const saveThis = this;
        ballImage.setOnCollideWith(hitDetection, () => {
            // Only going into the goal counts.
            if (ballImage.body.velocity.x > 0) {
                return;
            }
            const name = saveThis.lastHitViewer;
            const value = this.scores.get(name);
            if (value) {
                this.scores.set(name, value + 1);
            }
            else {
                this.scores.set(name, 1);
            }
            saveThis.updateScoreBoard();
            this.plusOneText.alpha = 0;
            this.plusOneTextTween.update(saveThis.add.tween({
                targets: saveThis.plusOneText,
                alpha: 1,
                duration: 500,
                yoyo: true,
                loop: 0,
            }));
        });
        // Reset ball when it goes into the reset area.
        const resetAreaRightX = 240;
        const ballResetDetection = this.matter.add.rectangle(resetAreaRightX / 2, 240, resetAreaRightX, 180, { ignoreGravity: true, isStatic: true, isSensor: true });
        ballImage.setOnCollideWith(ballResetDetection, () => {
            saveThis.resetBallTimeout.update(() => {
                if (ballImage.x < resetAreaRightX) {
                    ballImage.setPosition(CONST.GAME_WIDTH / 2, 100);
                }
            }, 3000);
        });
        // Score bulletin.
        const bulletin = new RotatingText(this, 0, 200, this.CAMERA_AREA_WIDTH, 100);
        this.addPrefab(bulletin);
        bulletin.setDepth(CONST.LAYERS.FRONT);
        bulletin.textArea?.setDepth(CONST.LAYERS.FRONT);
        bulletin.rotationSpeedY = 30;
        bulletin.textArea?.setText('Play with Cato');
        this.scoreBulletin = bulletin;
        // "Who has the ball" text.
        const whoHasBallText = this.add.text(10, 170, 'No one controls the ball', CONST.FONT_STYLES.GREENISH('2em'));
        whoHasBallText.setDepth(CONST.LAYERS.TEXT);
        this.whoHasBallText = whoHasBallText;
        // Camera area blocker.
        this.matter.add.rectangle(this.CAMERA_AREA_WIDTH / 2, CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT / 2, this.CAMERA_AREA_WIDTH, this.CAMERA_AREA_HEIGHT, { ignoreGravity: true, isStatic: true });
    }
    createNewAvatar(viewerName, viewerAvatarConfig) {
        const avatar = new AvatarCar(this, viewerAvatarConfig.imageKey, this.AVATAR_SIZE * viewerAvatarConfig.sizeFactor, viewerName);
        const saveThis = this;
        avatar.maybeActOnMainImage((img) => {
            img.x = Phaser.Math.Between(CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH - img.displayWidth);
            img.y = img.displayHeight;
            img.setMass(this.AVATAR_MASS * viewerAvatarConfig.sizeFactor);
            img.setBounce(Phaser.Math.FloatBetween(this.AVATOR_BOUNCE_MIN, this.AVATOR_BOUNCE_MAX));
            const friction = Phaser.Math.FloatBetween(this.AVATOR_FRICTION_MIX, this.AVATOR_FRICTION_MAX);
            img.setFriction(friction);
            img.setFrictionStatic(friction);
            img.setOnCollideWith(saveThis.ball, () => {
                const speed = new Phaser.Math.Vector2(img.body.velocity.x, img.body.velocity.y).length();
                if (speed > this.AVATAR_MINIMAL_CONTROL_VELOCITY) {
                    saveThis.lastHitViewer = viewerName;
                    saveThis.whoHasBallText.text = `${viewerName} now controls the ball!`;
                }
            });
        });
        return avatar;
    }
    updateScoreBoard() {
        const topScorers = [...this.scores.keys()];
        topScorers.sort((v1, v2) => { return this.scores.get(v2) - this.scores.get(v1); });
        const messages = ['Cato Game Leaderboard'];
        let idx = 0;
        for (const scorer of topScorers) {
            messages.push(`${idx + 1}. ${scorer}: ${this.scores.get(scorer)}`);
            idx++;
        }
        this.scoreBulletin?.textArea?.setText(messages);
    }
}
class SceneSoccer extends BaseShowScene {
    // Avatar speed needs to be greater than this value for a touch event be considered
    // as a control.
    AVATAR_MINIMAL_CONTROL_VELOCITY = 2;
    // Shooting target related.
    // Location should match camera location.
    TARGET_X = this.CAMERA_AREA_WIDTH;
    TARGET_Y = CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT;
    targetHitDetection;
    ball;
    lastHitViewer = '';
    // +1 text.
    plusOneText;
    plusOneTextTween = new QPhaser.SingletonTween();
    // Score bulletin.
    scoreBulletin;
    scores = new Map();
    // Who has the ball text.
    whoHasBallText;
    // Ball reset related.
    resetBallTimeout = new QTime.AutoClearedTimeout();
    create() {
        super.create();
        this.createTargetRelatedUiElements();
        const saveThis = this;
        // TEST
        if (TESTING) {
            this.time.addEvent({
                delay: 10,
                callback: () => { saveThis.activateViewer(Phaser.Math.Between(1, 2000).toString()); },
                // loop: true,
                repeat: 10,
            });
        }
    }
    createTargetRelatedUiElements() {
        // Shooting target.
        const goalPoleImage = this.add.image(this.TARGET_X - 80, this.TARGET_Y - 60, 'goalpole');
        goalPoleImage.setFlipX(true);
        goalPoleImage.displayWidth = 160;
        goalPoleImage.displayHeight = 160;
        goalPoleImage.setDepth(CONST.LAYERS.FRONT);
        // Around goal pole.
        this.matter.add.trapezoid(this.TARGET_X - 110, this.TARGET_Y - 30, 100, 160, 1, { ignoreGravity: true, isStatic: true });
        this.matter.add.rectangle(this.TARGET_X - 60, this.TARGET_Y - 136, 110, 10, { ignoreGravity: true, isStatic: true });
        // Slant area to make sure ball can come out.
        this.matter.add.trapezoid(this.TARGET_X - 80, this.TARGET_Y + 15, 160, 10, 1, { ignoreGravity: true, isStatic: true });
        const hitDetection = this.matter.add.rectangle(this.TARGET_X - 40, this.TARGET_Y - 60, 40, 140, { ignoreGravity: true, isStatic: true, isSensor: true });
        this.targetHitDetection = hitDetection;
        // const targetImage = this.matter.add.image(
        //   this.TARGET_X - 10, this.TARGET_Y, 'target', 0,
        //   { isStatic: true });
        // targetImage.displayWidth = 40;
        // targetImage.displayHeight = 180;
        // this.target = targetImage;
        // Ball.
        const ballImage = this.matter.add.image(CONST.GAME_WIDTH / 2, this.TARGET_Y, 'soccer');
        ballImage.displayWidth = this.AVATAR_SIZE;
        ballImage.displayHeight = this.AVATAR_SIZE;
        ballImage.setCircle(this.AVATAR_SIZE * 0.5);
        ballImage.setMass(0.1);
        ballImage.setFriction(0.01);
        ballImage.setFrictionAir(0);
        ballImage.setFrictionStatic(0.1);
        ballImage.setBounce(0.8);
        this.ball = ballImage;
        // "+1" text.
        const plusOneText = this.add.text(this.TARGET_X + 60, this.TARGET_Y - 80, '+1', CONST.FONT_STYLES.GREENISH());
        plusOneText.setDepth(CONST.LAYERS.TEXT);
        plusOneText.setAlpha(0);
        this.plusOneText = plusOneText;
        // Update score when ball hits the target.
        const saveThis = this;
        ballImage.setOnCollideWith(hitDetection, () => {
            // Only going into the goal counts.
            if (ballImage.body.velocity.x > 0) {
                return;
            }
            const name = saveThis.lastHitViewer;
            const value = this.scores.get(name);
            if (value) {
                this.scores.set(name, value + 1);
            }
            else {
                this.scores.set(name, 1);
            }
            saveThis.updateScoreBoard();
            this.plusOneText.alpha = 0;
            this.plusOneTextTween.update(saveThis.add.tween({
                targets: saveThis.plusOneText,
                alpha: 1,
                duration: 500,
                yoyo: true,
                loop: 0,
            }));
        });
        // Reset ball when it goes into the reset area.
        const resetAreaRightX = 200;
        const ballResetDetection = this.matter.add.rectangle(resetAreaRightX / 2, 240, resetAreaRightX, 180, { ignoreGravity: true, isStatic: true, isSensor: true });
        ballImage.setOnCollideWith(ballResetDetection, () => {
            saveThis.resetBallTimeout.update(() => {
                if (ballImage.x < resetAreaRightX) {
                    ballImage.setPosition(CONST.GAME_WIDTH / 2, 100);
                }
            }, 3000);
        });
        // Score bulletin.
        const bulletin = new RotatingText(this, 0, 200, this.CAMERA_AREA_WIDTH, 100);
        this.addPrefab(bulletin);
        bulletin.setDepth(CONST.LAYERS.FRONT);
        bulletin.textArea?.setDepth(CONST.LAYERS.FRONT);
        bulletin.rotationSpeedY = 30;
        bulletin.textArea?.setText('Play with Cato');
        this.scoreBulletin = bulletin;
        // "Who has the ball" text.
        const whoHasBallText = this.add.text(10, 170, 'No one controls the ball', CONST.FONT_STYLES.GREENISH('2em'));
        whoHasBallText.setDepth(CONST.LAYERS.TEXT);
        this.whoHasBallText = whoHasBallText;
        // Camera area blocker.
        this.matter.add.rectangle(this.CAMERA_AREA_WIDTH / 2, CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT / 2, this.CAMERA_AREA_WIDTH, this.CAMERA_AREA_HEIGHT, { ignoreGravity: true, isStatic: true });
    }
    createNewAvatar(viewerName, viewerAvatarConfig) {
        const avatar = new AvatarCar(this, viewerAvatarConfig.imageKey, this.AVATAR_SIZE * viewerAvatarConfig.sizeFactor, viewerName);
        const saveThis = this;
        avatar.maybeActOnMainImage((img) => {
            img.x = Phaser.Math.Between(CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH - img.displayWidth);
            img.y = img.displayHeight;
            img.setMass(this.AVATAR_MASS * viewerAvatarConfig.sizeFactor);
            img.setBounce(Phaser.Math.FloatBetween(this.AVATOR_BOUNCE_MIN, this.AVATOR_BOUNCE_MAX));
            const friction = Phaser.Math.FloatBetween(this.AVATOR_FRICTION_MIX, this.AVATOR_FRICTION_MAX);
            img.setFriction(friction);
            img.setFrictionStatic(friction);
            img.setOnCollideWith(saveThis.ball, () => {
                const speed = new Phaser.Math.Vector2(img.body.velocity.x, img.body.velocity.y).length();
                if (speed > this.AVATAR_MINIMAL_CONTROL_VELOCITY) {
                    saveThis.lastHitViewer = viewerName;
                    saveThis.whoHasBallText.text = `${viewerName} now controls the ball!`;
                }
            });
        });
        return avatar;
    }
    updateScoreBoard() {
        const topScorers = [...this.scores.keys()];
        topScorers.sort((v1, v2) => { return this.scores.get(v2) - this.scores.get(v1); });
        const messages = ['Cato Game Leaderboard'];
        let idx = 0;
        for (const scorer of topScorers) {
            messages.push(`${idx + 1}. ${scorer}: ${this.scores.get(scorer)}`);
            idx++;
        }
        this.scoreBulletin?.textArea?.setText(messages);
    }
}
