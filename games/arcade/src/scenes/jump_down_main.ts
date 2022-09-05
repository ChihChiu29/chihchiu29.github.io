class SceneJumpDownMain extends QPhaser.Scene {
  BLOCK_SPRITE_SIZE = 18;

  // Use these parameters to change difficulty.
  public platformMoveUpInitialSpeed = 30;
  public platformMoveUpSpeed = 0;  // initialize in `create`.
  public platformMoveLeftRightRandomRange = 10;
  public platformMoveLeftRightSpeedFactor = 30;

  // For platform spawn.
  // A new platform will be spawn randomly around delay=120000/platformMoveUpSpeed.
  public platformSpawnDelayFactorMin = 90000;
  public platformSpawnDelayFactorMax = 150000;
  public platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
  public platformSpawnWidthMax = CONST.GAME_WIDTH / 2;

  private player?: QPhaser.ArcadePrefab;
  private topBorder?: Phaser.GameObjects.Rectangle;
  private bottomBorder?: Phaser.GameObjects.Rectangle;
  private survivalTimeText?: Phaser.GameObjects.Text;
  private survivalTime = 0;

  private timer?: Phaser.Time.TimerEvent;

  create(): void {
    this.createBoundaries();
    this.createPlayer();
    this.platformMoveUpSpeed = this.platformMoveUpInitialSpeed;
    this.createPlatform(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50,
      this.platformSpawnWidthMax, this.platformMoveUpSpeed);
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
    const halfSpriteSize = this.BLOCK_SPRITE_SIZE / 2;
    for (let spikeIdx = 0; spikeIdx <= CONST.GAME_WIDTH / this.BLOCK_SPRITE_SIZE; spikeIdx++) {
      const x = spikeIdx * this.BLOCK_SPRITE_SIZE;
      const top = this.add.image(x, halfSpriteSize, 'tile_0068');
      top.setDepth(CONST.LAYERS.FRONT);
      top.setFlipY(true);
      const bottom = this.add.image(x, CONST.GAME_HEIGHT - halfSpriteSize, 'tile_0068');
      bottom.setDepth(CONST.LAYERS.FRONT);
    }

    const topBorder = this.add.rectangle(
      CONST.GAME_WIDTH / 2, 5,
      CONST.GAME_WIDTH, 10);
    this.physics.add.existing(topBorder, true);
    this.topBorder = topBorder;
    const bottomBorder = this.add.rectangle(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 5,
      CONST.GAME_WIDTH, 10);
    this.physics.add.existing(bottomBorder, true);
    this.bottomBorder = bottomBorder;
  }

  // Needs to be called after createSpikes.
  private createPlayer() {
    const player = new PlayerKennyCat(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2);
    // A demo that a different type of player can be easily created.
    // const player = new PlayerDragon(this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2);
    this.addPrefab(player);

    player.maybeActOnMainImg((img) => {
      this.physics.add.overlap(img, [this.topBorder!, this.bottomBorder!], () => {
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
  private spawnPlatform(): void {
    this.createPlatform(
      Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH),
      CONST.GAME_HEIGHT + 50,
      Phaser.Math.FloatBetween(
        this.platformSpawnWidthMin, this.platformSpawnWidthMax),
      this.platformMoveUpSpeed,
      true,
    );
  }

  // Lowest level function to create a platform.
  private createPlatform(
    x: number, y: number, width: number, moveUpSpeed: number, canMove: boolean = false): void {
    const platformShouldMove: boolean = canMove && Phaser.Math.Between(1, 10) > 6;
    const platformMoveSpeed: number =
      Phaser.Math.Between(
        -this.platformMoveLeftRightRandomRange,
        this.platformMoveLeftRightRandomRange)
      * this.platformMoveLeftRightSpeedFactor;

    const numOfBlocks = Math.floor(width / this.BLOCK_SPRITE_SIZE);
    for (let idx = 0; idx < numOfBlocks; idx++) {
      const blockX = x + (-numOfBlocks / 2 + idx) * this.BLOCK_SPRITE_SIZE;
      let tile: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (idx == 0) {
        tile = this.physics.add.image(blockX, y, 'tile_0001');
      } else if (idx == numOfBlocks - 1) {
        tile = this.physics.add.image(blockX, y, 'tile_0003');
      } else {
        tile = this.physics.add.image(blockX, y, 'tile_0002');
      }

      // Use setImmovable instead setPushable so it can give friction on player.
      tile.setImmovable(true);
      tile.body.allowGravity = false;
      this.player?.maybeActOnMainImg((img) => {
        this.physics.add.collider(img, tile);
      });
      this.physics.add.overlap(tile, this.topBorder!, () => {
        tile.destroy();
      });
      tile.setVelocityY(-moveUpSpeed);

      if (platformShouldMove) {
        tile.setVelocityX(platformMoveSpeed);
        this.add.tween({
          targets: tile.body.velocity,
          x: -platformMoveSpeed,
          duration: 1000,
          yoyo: true,
          loop: -1,
        });
      }
    }
  }
}
