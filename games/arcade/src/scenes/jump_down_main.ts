let DEBUG_SCENE: Phaser.Scene;

class SceneJumpDownMain extends QPhaser.Scene {
  BLOCK_SPRITE_SIZE = 20;
  PLAYER_SIZE = 32;
  ITEM_SPRITE_SIZE = 16;  // need to be smaller than block size.

  SPRITESHEET_KEY = 'tiles';

  // Tiles will be break into segments, each contains at this number of tiles,
  // each segment is a unit for special tile generation.
  TILE_GENERATION_SIZE = 4;

  // Use these parameters to change difficulty.
  public platformMoveUpInitialSpeed = 30;
  public platformMoveLeftRightRandomRange = 10;
  public platformMoveLeftRightSpeedFactor = 30;

  // For platform spawn.
  // A new platform will be spawn randomly around 
  // delay = 120000 / current platform move up speed.
  public platformSpawnDelayFactorMin = 90000;
  public platformSpawnDelayFactorMax = 150000;
  public platformSpawnWidthMin = CONST.GAME_WIDTH / 10;
  public platformSpawnWidthMax = CONST.GAME_WIDTH / 2;

  private player?: QPhaser.ArcadePrefab;
  private topBorder?: Phaser.GameObjects.Rectangle;
  private bottomBorder?: Phaser.GameObjects.Rectangle;
  private survivalTimeText?: Phaser.GameObjects.Text;
  private survivalTime = 0;

  // Multiplicative factor for platform move speed.
  private platformSpeedFactor = new QLib.PrimitiveRef<number>(1);

  // Last SetTimeout ID for spawning platform.
  private lastSpawnPlatformTimeout = 0;

  private playerData: PlayerProperties | undefined;

  init(playerData: PlayerProperties): void {
    this.playerData = playerData;
  }

  create(): void {
    super.create();
    this.platformSpeedFactor.set(1.0);

    this.createBoundaries();
    this.createPlayer();
    this.createPlatform(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50,
      this.platformSpawnWidthMax,
      false,  // no move left right
      false,  // use normal tiles only.
    );
    this.createSurvivalTimer();
    this.createInputIndicators();

    this.startPlatformSpawnActions();

    DEBUG_SCENE = this;
  }

  update(totalTime: number, delta: number): void {
    super.update(totalTime, delta);

    const time = this.timeSinceSceneStartMs / 1000;
    if (this.survivalTimeText) {
      this.survivalTimeText.setText(`${time.toFixed(1)}`);
      this.survivalTime = time;
    }

    // Make game harder over time.
    this.platformSpeedFactor.set(this.platformSpeedFactor.get() + delta / 20000);
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
    let player: ArcadePlayerBase;
    if (this.playerData!.playerType === CONST.PLAYER_TYPE.ANIMATED) {
      player = new PlayerAnimatedSingleSheet(
        this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.playerData!);
    } else {
      player = new PlayerSingleSprite(
        this, CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.playerData!);
    }
    player.playerLeftRightSpeed = this.playerData!.leftRightSpeed;
    player.playerLeftRightDashSpeed = this.playerData!.leftRightDashSpeed;
    player.playerJumpSpeed = this.playerData!.jumpSpeed;
    player.playerNumAllowedJumps = this.playerData!.numAllowedJumps;
    this.addPrefab(player);

    player.maybeActOnMainImg((img) => {
      this.physics.add.overlap(img, [this.topBorder!, this.bottomBorder!], () => {
        this.gotoEndGame();
      });
    });

    this.player = player;
  }

  private createSurvivalTimer() {
    const statusText = this.add.text(
      20, 10, 'Good luck!',
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

  private createInputIndicators() {
    const leftRightGap = 50;
    const bottomGap = 50;
    // left
    this.add.triangle(
      leftRightGap, CONST.GAME_HEIGHT - bottomGap,
      -25, 0,
      0, 25,
      0, -25,
      0xfc62b7)
      .setDepth(CONST.LAYERS.BACKGROUND);
    // right
    this.add.triangle(
      CONST.GAME_WIDTH - 25, CONST.GAME_HEIGHT - bottomGap,
      25, 0,
      0, -25,
      0, 25,
      0xfc62b7)
      .setDepth(CONST.LAYERS.BACKGROUND);
    // center
    this.add.triangle(
      CONST.GAME_WIDTH / 2 + 25, CONST.GAME_HEIGHT - bottomGap,
      0, -25,
      -25, 0,
      25, 0,
      0xfc62b7)
      .setDepth(CONST.LAYERS.BACKGROUND);
  }

  private startPlatformSpawnActions() {
    const currentSpeed = this.platformMoveUpInitialSpeed
      * this.platformSpeedFactor.get();
    this.lastSpawnPlatformTimeout = setTimeout(() => {
      this.spawnPlatform();
      this.startPlatformSpawnActions();
    }, Phaser.Math.FloatBetween(
      this.platformSpawnDelayFactorMin / currentSpeed,
      this.platformSpawnDelayFactorMax / currentSpeed));
  }

  // Spawn a new platform from bottom, needs to be called after createPlayer.
  private spawnPlatform(): void {
    this.createPlatform(
      Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH),
      CONST.GAME_HEIGHT + 50,
      Phaser.Math.FloatBetween(
        this.platformSpawnWidthMin, this.platformSpawnWidthMax),
      /*useSpecialTiles*/ true,
    );
  }

  // Lowest level function to create a platform.
  private createPlatform(
    x: number, y: number, width: number,
    canMoveLeftNRight: boolean = false,
    useSpecialTiles: boolean = true,
  ): void {
    // First set up platform tiles.
    const platformShouldMove: boolean = canMoveLeftNRight && Phaser.Math.Between(1, 10) > 6;
    const platformMoveSpeed: number =
      Phaser.Math.Between(
        -this.platformMoveLeftRightRandomRange,
        this.platformMoveLeftRightRandomRange)
      * this.platformMoveLeftRightSpeedFactor;

    const numOfBlocks = Math.floor(width / this.BLOCK_SPRITE_SIZE);
    const tilePositions: QPoint[] = [];
    for (let idx = 0; idx < numOfBlocks; idx++) {
      const blockX = x + (-numOfBlocks / 2 + idx) * this.BLOCK_SPRITE_SIZE;
      tilePositions.push({ x: blockX, y: y });
    }

    const tiles: ArcadeSprite[] = [];
    for (let i = 0; i < tilePositions.length; i += this.TILE_GENERATION_SIZE) {
      for (const tile of this.createTilesForSegments(
        tilePositions.slice(i, i + this.TILE_GENERATION_SIZE), useSpecialTiles)) {
        tiles.push(tile);
      }
    }

    for (const tile of tiles) {
      this.addPrefab(tile);

      tile.setCollideWith([this.player!]);
      tile.setOverlapWithGameObjects([this.topBorder!], () => {
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
    if (itemTypeRandomChoice < 20) {
      const tileChoice = tiles[Phaser.Math.Between(0, tiles.length - 1)];
      const { x, y } = tileChoice.getPosition();

      let item: ItemBase;
      if (itemTypeRandomChoice < 10) {
        const addTimeItem = new ItemAddTime(this, x, y - this.BLOCK_SPRITE_SIZE,
          this.SPRITESHEET_KEY, 896, this.ITEM_SPRITE_SIZE);
        addTimeItem.setEffect([this.player!], (amountToAdd: number) => {
          this.timeSinceSceneStartMs += amountToAdd;
        });

        item = addTimeItem;
      } else {
        const reduceSpeedItem = new ItemReduceSpeed(this, x, y - this.BLOCK_SPRITE_SIZE,
          this.SPRITESHEET_KEY, 876, this.ITEM_SPRITE_SIZE);
        reduceSpeedItem.setEffect([this.player!], this.platformSpeedFactor);

        item = reduceSpeedItem;
      }

      item.setCollideWith(tiles);
      item.setOverlapWithGameObjects([this.topBorder!], () => {
        item.destroy();
      });
      this.addPrefab(item);
    }
  }

  // A segment of tiles used together for creation of special tiles.
  // Each segment can only contain one type of special tiles.
  // Collisions with player and boundary are set in createPlatform.
  private createTilesForSegments(
    tilePositions: QPoint[],
    useSpecialTiles: boolean = true,
  ): ArcadeSprite[] {
    const tiles: ArcadeSprite[] = [];
    let choice = 100;  // default to use normal tiles only.
    if (useSpecialTiles) {
      choice = Phaser.Math.Between(1, 100);
    }
    if (choice < 10) {
      // 1/10 chance to create auto disappearing tiles
      for (const pos of tilePositions) {
        const tile = new TileSelfDestroy(
          this, pos.x, pos.y,
          this.platformMoveUpInitialSpeed, this.platformSpeedFactor,
          this.SPRITESHEET_KEY, 3,
          this.BLOCK_SPRITE_SIZE);
        tile.setDisappearAfterOverlappingWith([this.player!]);
        tiles.push(tile);
      }
    } else if (choice < 20) {
      // 1/10 chance to create jump tiles
      for (const pos of tilePositions) {
        const tile = new TileForceJump(
          this, pos.x, pos.y,
          this.platformMoveUpInitialSpeed, this.platformSpeedFactor,
          this.SPRITESHEET_KEY, 302,
          this.BLOCK_SPRITE_SIZE,
        );
        tile.setPushPrefabsUp(
          [this.player!], 300,
          this.SPRITESHEET_KEY, 196);
        tiles.push(tile);
      }
    } else {
      for (const pos of tilePositions) {
        tiles.push(this.createNormalTile(pos.x, pos.y));
      }
    }
    return tiles;
  }

  private createNormalTile(x: number, y: number): ArcadeSprite {
    return new TileMovingUp(
      this, x, y,
      this.platformMoveUpInitialSpeed, this.platformSpeedFactor,
      this.SPRITESHEET_KEY, 123, this.BLOCK_SPRITE_SIZE);
  }

  private gotoEndGame() {
    clearTimeout(this.lastSpawnPlatformTimeout);
    this.scene.start(SCENE_KEYS.JumpDownEnd, {
      score: this.survivalTime,
    });
  }
}
