class SceneJumpDownMain extends QPhaser.Scene {
  // Use these parameters to change difficulty.
  public platformMoveUpInitialSpeed = 30;
  public platformMoveUpSpeed = 0;  // initialize in `create`.

  // For platform spawn.
  // A new platform will be spawn randomly around delay=120000/platformMoveUpSpeed.
  public platformSpawnDelayFactorMin = 90000;
  public platformSpawnDelayFactorMax = 150000;
  public platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
  public platformSpawnWidthMax = CONST.GAME_WIDTH / 2;

  private player?: QPhaser.ArcadePrefab;
  private spikes?: Phaser.Physics.Arcade.StaticGroup;
  private topBorder?: Phaser.GameObjects.Rectangle;
  private survivalTimeText?: Phaser.GameObjects.Text;
  private survivalTime = 0;

  private timer?: Phaser.Time.TimerEvent;

  create(): void {
    this.createBoundaries();
    this.createPlayer();
    this.platformMoveUpSpeed = this.platformMoveUpInitialSpeed;
    this.createPlatform(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, this.platformSpawnWidthMax)
      .setVelocityY(-this.platformMoveUpSpeed);
    this.createSurvivalTimer();

    this.startPlatformSpawnActions();

    this.timer = this.time.addEvent({
      delay: 3600 * 1000,
      loop: true,
    });
  }

  update(totalTime: number, delta: number): void {
    super.update(totalTime, delta);
    const time = this.timer!.getElapsedSeconds();
    if (this.survivalTimeText) {
      this.survivalTimeText.setText(`${time.toFixed(1)}`);
      this.survivalTime = time;
    }
    // Make game harder over time.
    this.platformMoveUpSpeed = this.platformMoveUpInitialSpeed + time * 0.8;
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
    const player = new PlayerKennyCat(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2);
    this.addPrefab(player);

    player.maybeActOnMainImg((img) => {
      this.physics.add.overlap(img, this.spikes!, () => {
        this.scene.start(SCENE_KEYS.JumpDownEnd, {
          score: this.survivalTime,
        });
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
      this.platformSpawnDelayFactorMin / this.platformMoveUpSpeed,
      this.platformSpawnDelayFactorMax / this.platformMoveUpSpeed));
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
    platform.setDisplaySize(width, 20);
    // Use setImmovable instead setPushable so it can give friction on player.
    platform.setImmovable(true);
    platform.body.allowGravity = false;

    this.player?.maybeActOnMainImg((img) => {
      this.physics.add.collider(img, platform);
    });
    this.physics.add.overlap(platform, this.topBorder!, () => {
      platform.destroy();
    });

    return platform;
  }
}
