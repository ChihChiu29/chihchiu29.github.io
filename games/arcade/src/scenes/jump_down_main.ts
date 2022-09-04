class SceneJumpDownMain extends QPhaser.Scene {
  TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
  TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;

  // Use these parameters to change difficulty.
  public platformMoveUpSpeed = 30;
  public playerLeftRightSpeed = 160;
  public playerJumpSpeed = 350;
  public playerFallSpeed = 100;

  // For platform spawn.
  // A new platform will be spawn randomly with this delay.
  public platformSpawnDelayMin = 2500;
  public platformSpawnDelayMax = 5000;
  public platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
  public platformSpawnWidthMax = CONST.GAME_WIDTH / 1.8;

  private player?: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private spikes?: Phaser.Physics.Arcade.StaticGroup;
  private topBorder?: Phaser.GameObjects.Rectangle;
  private survivalTimeText?: Phaser.GameObjects.Text;
  private survivalTime = 0;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  private timer?: Phaser.Time.TimerEvent;

  create(): void {
    this.createBoundaries();
    this.createPlayer();
    this.createPlatform(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, this.platformSpawnWidthMax)
      .setVelocityY(-this.platformMoveUpSpeed);
    this.createSurvivalTimer();

    this.startPlatformSpawnActions();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = QUI.createKeyMap(this);
    this.input.addPointer(3);  // needs at most 3 touch points (most 2 are valid).

    this.timer = this.time.addEvent({
      delay: 3600 * 1000,
      loop: true,
    });
  }

  update(): void {
    if (this.cursors) {
      this.handleInput(this.cursors);
    }
    const time = this.timer!.getElapsedSeconds();
    if (this.survivalTimeText) {
      this.survivalTimeText.setText(`${time.toFixed(1)}`);
      this.survivalTime = time;
    }
  }

  private createBoundaries() {
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

    spikes.setDepth(CONST.LAYERS.FRONT);
    this.spikes = spikes;

    const topBorder = this.add.rectangle(CONST.GAME_WIDTH / 2, 0, CONST.GAME_WIDTH, 20, 0x6666ff);
    this.physics.add.existing(topBorder, true);
    this.topBorder = topBorder;
  }

  // Needs to be called after createSpikes.
  private createPlayer() {
    const player = this.physics.add.image(500, 200, 'scared');
    // player.setScale(0.5, 0.5);
    player.setDisplaySize(60, 60);
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    player.setFrictionX(1);

    this.physics.add.overlap(player, this.spikes!, () => {
      this.scene.start(SCENE_KEYS.JumpDownEnd, {
        score: this.survivalTime,
      });
    });

    this.player = player;
  }

  private createSurvivalTimer() {
    const statusText = this.add.text(
      20, 100, 'Good luck!',
      {
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

  private startPlatformSpawnActions() {
    const saveThis = this;
    setTimeout(function () {
      if (saveThis.scene.manager.isActive(saveThis)) {
        saveThis.spawnPlatform();
        saveThis.startPlatformSpawnActions();
      }
    }, Phaser.Math.FloatBetween(
      this.platformSpawnDelayMin, this.platformSpawnDelayMax));
  }

  // Spawn a new platform from bottom, needs to be called after createPlayer.
  private spawnPlatform(): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    const platform = this.createPlatform(
      Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH),
      CONST.GAME_HEIGHT + 50,
      Phaser.Math.FloatBetween(
        this.platformSpawnWidthMin, this.platformSpawnWidthMax),
    );
    platform.setVelocityY(-this.platformMoveUpSpeed);

    return platform;
  }

  // Lowest level function to create a platform.
  private createPlatform(x: number, y: number, width: number):
    Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    const platform = this.physics.add.image(x, y, 'platform');
    platform.setDisplaySize(width, 40);
    // Use setImmovable instead setPushable so it can give friction on player.
    platform.setImmovable(true);
    platform.body.allowGravity = false;

    this.physics.add.collider(this.player!, platform);
    this.physics.add.overlap(platform, this.topBorder!, () => {
      platform.destroy();
    });

    return platform;
  }

  private handleInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    const ptr = this.input.activePointer;

    // First get user intention.
    // Keyboard based control.
    let moveLeft = this.keys.A.isDown || cursors.left.isDown;
    let moveRight = this.keys.D.isDown || cursors.right.isDown;
    let moveUp = this.keys.W.isDown || cursors.up.isDown;
    // Touch screen based control.
    for (const ptr of [this.input.pointer1, this.input.pointer2]) {
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
      this.player?.setVelocityX(-this.playerLeftRightSpeed);
      this.player?.setFlipX(false);
    } else if (moveRight) {
      this.player?.setVelocityX(this.playerLeftRightSpeed);
      this.player?.setFlipX(true);
    } else {
      this.player?.setVelocityX(0);
    }

    if (moveUp && this.player?.body.touching.down) {
      this.player?.setVelocityY(-this.playerJumpSpeed);
    }
  }
}
