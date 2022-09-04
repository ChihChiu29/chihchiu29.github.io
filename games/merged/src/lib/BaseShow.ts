let DEBUG_SCENE;

interface Viewer {
  username: string;
  lastActiveTimestamp: number;
}

interface AvatarConfig {
  imageKey: string;
  sizeFactor: number;
}

// Base class for a Show scene, focus on viewer management.
// Some constants are not used by this class, but by subclasses.
abstract class BaseShowScene extends QPhaser.Scene {

  NO_SHOW_USERS: Set<string> = new Set([
    'nightbot',
    'streamelements',
    'anotherttvviewer',
    'supercatobot',
    'supercatobot2',
  ]);

  // Special treatment for avatars for some users.
  AVATAR_SPECIAL_VIEWERS: { [key: string]: AvatarConfig } = {
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
    ROLL_RIGHT: '65b338d9-411b-413c-9d05-08bb81069d7a',  // squeeze
    // '!private_randomavatar_epic': 'c141b5c1-ce4c-408e-91fa-4b193f1ff5df',
  };

  CUSTOM_COMMAND_CHAR_SET = ['q', 'w', 'e', 'a', 's', 'd', 'x'];

  CAMERA_AREA_WIDTH: number = 320;
  CAMERA_AREA_HEIGHT: number = 440;

  ACTIVE_VIEWER_LIMIT: number = TESTING ? 400 : 30;
  INACTIVE_TIME_MS: number = TESTING ? 10 * 60 * 1000 : 30 * 60 * 1000;  // 10 min

  AVATAR_SIZE: number = TESTING ? 40 : 60;
  AVATAR_SIZE_VARIATION_FACTOR: number = 0.2;  // actual size is in the range +/- this factor times size
  AVATAR_MASS: number = 1;
  AVATAR_PUSH_STRENTH: number = 0.07;
  AVATAR_ROTATE_STRENTH: number = 0.05;
  AVATOR_JUMP_STRENTH: number = 0.05;
  AVATOR_BOUNCE_MIN: number = 0.1;
  AVATOR_BOUNCE_MAX: number = 0.3;
  AVATOR_FRICTION_MIX: number = 0.001;
  AVATOR_FRICTION_MAX: number = 0.1;

  // Viewer related properties are always key'ed by username.
  private registeredViewers: Map<string, Viewer> = new Map<string, Viewer>();
  private activeViewers: Map<string, Avatar> = new Map<string, Avatar>();

  // Helps to execute multiple user commands.
  private cmdQueue = new QTime.SequenceActionThrottler(50);

  create(): void {
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
  protected activateViewer(name: string): Avatar {
    // First, registration.
    let viewer: Viewer | undefined = this.registeredViewers.get(name);
    if (!viewer) {
      viewer = {
        username: name,
        lastActiveTimestamp: QTime.now(),
      };
      this.registeredViewers.set(name, viewer);
    } else {
      viewer.lastActiveTimestamp = QTime.now();
    }

    // Next, add it to active viewer.
    let viewerAvatar: Avatar | undefined = this.activeViewers.get(name);
    if (viewerAvatar) {
      return viewerAvatar;  // no need to update prefab.
    } else {
      let avatarImageKey: string;
      let sizeVariationFactor: number;
      if (this.AVATAR_SPECIAL_VIEWERS.hasOwnProperty(viewer.username)) {
        avatarImageKey = this.AVATAR_SPECIAL_VIEWERS[viewer.username].imageKey;
        sizeVariationFactor = this.AVATAR_SPECIAL_VIEWERS[viewer.username].sizeFactor;
      } else {
        avatarImageKey = Phaser.Math.RND.pick(GLOBAL.CATO_DRAWN_AVATARS);
        sizeVariationFactor = 1 + Phaser.Math.FloatBetween(
          -this.AVATAR_SIZE_VARIATION_FACTOR, this.AVATAR_SIZE_VARIATION_FACTOR);
      }

      const avatar: Avatar = this.createNewAvatar(
        name,
        {
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

  // @Abstract
  // Creates a new Avatar, no need to add to scene, base function will do that.
  abstract createNewAvatar(viewerName: string, viewerAvatarConfig: AvatarConfig): Avatar;

  private deactiveViewer(name: string, unregister: boolean = false) {
    let viewerAvatar: QPhaser.Prefab | undefined = this.activeViewers.get(name);
    if (viewerAvatar) {
      this.destroyPrefab(viewerAvatar);
      this.activeViewers.delete(name);
    }
    if (unregister) {
      this.registeredViewers.delete(name);
    }
  }

  // Remove the inactive viewers in `activeViewers`.
  private removeInactiveViewers() {
    const now = QTime.now();
    const shouldRemove: string[] = [];
    for (const username of this.activeViewers.keys()) {
      const viewer: Viewer = this.registeredViewers.get(username)!;
      if (now - viewer.lastActiveTimestamp > this.INACTIVE_TIME_MS) {
        shouldRemove.push(username);
      }
    }
    for (const username of shouldRemove) {
      this.deactiveViewer(username);
    }
  }

  // Trim least active viewer from `activeViewer` if over capacity.
  private trimActiveViewers() {
    if (this.activeViewers.size > this.ACTIVE_VIEWER_LIMIT) {
      const activeViewerNames = [...this.activeViewers.keys()];
      activeViewerNames.sort((v1, v2) => {
        return this.registeredViewers.get(v2)!.lastActiveTimestamp -
          this.registeredViewers.get(v1)!.lastActiveTimestamp;
      });
      const shouldRemove: string[] = activeViewerNames.splice(this.ACTIVE_VIEWER_LIMIT);
      for (const username of shouldRemove) {
        this.deactiveViewer(username);
      }
    }
  }

  preload() {
    let saveThis = this;
    CHAT_LISTENER.startListening(
      (who: string, rawMsg: string, msgArray: string[], extraInfo: QExtraInfo) => {
        if (this.NO_SHOW_USERS.has(who)) {
          return;
        }

        // Add / renew viewer, highlight speaking icon.
        saveThis.activateViewer(who);
        const viewer: ActionableViewer = saveThis.activeViewers.get(who)!;
        viewer.highlightSpeaking(rawMsg);

        // Process command.
        if (extraInfo.rewardId) {
          saveThis.processSingleCommand(who, viewer, rawMsg, extraInfo);
        } else if (!QString.stringContains(rawMsg, ' ')) {
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
              } else {
                saveThis.cmdQueue.enqueue(() => {
                  saveThis.processSingleCommand(who, viewer, cmdMsg, extraInfo);
                });
              }
            }
          }
        }
      })
  }

  private processSingleCommand(
    who: string,
    viewer: ActionableViewer,
    cmdMsg: string,
    extraInfo: QExtraInfo) {
    if (extraInfo.rewardId) {
      const cmd = extraInfo.rewardId;
      if (cmd === this.CUSTOM_REWARDS.CHANGE_AVATAR) {
        this.deactiveViewer(who, true);
        this.activateViewer(who);
      } else if (cmd === this.CUSTOM_REWARDS.JUMP) {
        viewer.jump(this.AVATOR_JUMP_STRENTH);
      } else if (cmd === this.CUSTOM_REWARDS.PUSH_LEFT) {
        viewer.push(-this.AVATAR_PUSH_STRENTH);
      } else if (cmd === this.CUSTOM_REWARDS.PUSH_RIGHT) {
        viewer.push(this.AVATAR_PUSH_STRENTH);
      } else if (cmd === this.CUSTOM_REWARDS.ROLL_LEFT) {
        viewer.rotate(-this.AVATAR_ROTATE_STRENTH);
      } else if (cmd === this.CUSTOM_REWARDS.ROLL_RIGHT) {
        viewer.rotate(this.AVATAR_ROTATE_STRENTH);
      }
    } else {
      if (cmdMsg === 'w') {
        viewer.jump(this.AVATOR_JUMP_STRENTH);
      } else if (cmdMsg === 's') {
        viewer.jump(-this.AVATOR_JUMP_STRENTH);
      } else if (cmdMsg === 'a') {
        viewer.push(-this.AVATAR_PUSH_STRENTH);
      } else if (cmdMsg === 'd') {
        viewer.push(this.AVATAR_PUSH_STRENTH);
      } else if (cmdMsg === 'q') {
        viewer.rotate(-this.AVATAR_ROTATE_STRENTH);
      } else if (cmdMsg === 'e') {
        viewer.rotate(this.AVATAR_ROTATE_STRENTH);
      } else if (cmdMsg === 'WAIT') {
        // wait
      }
    }
  }
}
