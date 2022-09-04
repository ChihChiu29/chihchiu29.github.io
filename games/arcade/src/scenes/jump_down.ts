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
  private spikes?: Phaser.Physics.Arcade.StaticGroup;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  create(): void {
    // this.cameras.main.setViewport(
    //   CONST.GAME_WIDTH / 2,
    //   CONST.GAME_WIDTH / 2,
    //   CONST.GAME_WIDTH,
    //   CONST.GAME_HEIGHT);

    this.createSpikes();
    this.createPlayer();
    this.createPlatform(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, 2)
      .setVelocityY(-this.platformMoveUpSpeed);

    this.startPlatformSpawnActions();

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(): void {
    if (this.cursors) {
      this.handleInput(this.cursors);
    }
  }

  private createSpikes() {
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
  }

  // Needs to be called after createSpikes.
  private createPlayer() {
    const player = this.physics.add.image(500, 200, 'dragon');
    player.setScale(0.5, 0.5);
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    player.setFrictionX(1);

    this.player = player;
  }

  private startPlatformSpawnActions() {
    const saveThis = this;
    setTimeout(function () {
      saveThis.spawnPlatform();
      saveThis.startPlatformSpawnActions();
    }, Phaser.Math.FloatBetween(
      this.platformSpawnDelayMin, this.platformSpawnDelayMax));
  }

  // Spawn a new platform from bottom, needs to be called after createPlayer.
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
