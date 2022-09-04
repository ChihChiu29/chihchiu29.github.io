class SceneJumpDown extends QPhaser.Scene {
  // Use these parameters to change difficulty.
  public platformMoveUpSpeed = 30;
  public playerLeftRightSpeed = 160;

  // For platform spawn.
  // A new platform will be spawn randomly with this delay.
  public platformSpawnDelayMin = 2000;
  public platformSpawnDelayMax = 5000;
  public platformSpawnLengthFactorMin = 0.1;
  public platformSpawnLengthFactorMax = 2;

  private player?: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private platforms: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[] = [];

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  create(): void {
    // this.cameras.main.setViewport(CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH, CONST.GAME_HEIGHT);

    this.createPlayer();
    this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, 2).setVelocityY(-this.platformMoveUpSpeed);

    this.startPlatformSpawnActions();

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(): void {
    if (this.cursors) {
      this.handleInput(this.cursors);
    }
  }

  private startPlatformSpawnActions() {
    const saveThis = this;
    setTimeout(function () {
      saveThis.spawnPlatform();
      saveThis.startPlatformSpawnActions();
    }, Phaser.Math.FloatBetween(
      this.platformSpawnDelayMin, this.platformSpawnDelayMax));
  }

  // Spawn a new platform from bottom.
  private spawnPlatform(): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    const platform = this.createPlatform(
      Phaser.Math.FloatBetween(0, CONST.GAME_WIDTH),
      CONST.GAME_HEIGHT + 50,
      Phaser.Math.FloatBetween(
        this.platformSpawnLengthFactorMin, this.platformSpawnLengthFactorMax),
    );
    platform.setVelocityY(-this.platformMoveUpSpeed);
    return platform;
  }

  // Lowest level function to create a platform.
  private createPlatform(x: number, y: number, widthScale: number):
    Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    const platform = this.physics.add.image(x, y, 'platform');
    platform.setScale(widthScale, 1);
    // Use setImmovable instead setPushable so it can give friction on player.
    platform.setImmovable(true);
    platform.body.allowGravity = false;

    this.physics.add.collider(this.player!, platform);
    this.platforms.push(platform);

    return platform;
  }

  private createPlayer() {
    const player = this.physics.add.image(500, 200, 'dragon');
    player.setScale(0.5, 0.5);
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    player.setFrictionX(1);

    this.player = player;
  }

  private handleInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (cursors.left.isDown) {
      this.player?.setVelocityX(-this.playerLeftRightSpeed);
      this.player?.setFlipX(false);
    } else if (cursors.right.isDown) {
      this.player?.setVelocityX(this.playerLeftRightSpeed);
      this.player?.setFlipX(true);
    } else {
      this.player?.setVelocityX(0);
    }

    if (cursors.up.isDown && this.player?.body.touching.down) {
      this.player?.setVelocityY(-330);
    }
  }
}
