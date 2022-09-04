var DEBUG_SCENE;

class SceneJumpDown extends QPhaser.Scene {

  PLAYER_LEFT_RIGHT_SPEED = 160;

  public player?: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  public platforms: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[] = [];

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  create(): void {
    this.createPlayer();
    this.createPlatforms();

    this.cursors = this.input.keyboard.createCursorKeys();

    DEBUG_SCENE = this;
  }

  update(): void {
    if (this.cursors) {
      this.handleInput(this.cursors);
    }
  }

  private createPlatforms() {
    this.createPlatform(400, 568).setScale(2);

    this.createPlatform(400, 400).setVelocityX(10);
  }

  private createPlatform(x: number, y: number):
    Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    const platform = this.physics.add.image(x, y, 'platform');
    // Use 
    platform.setImmovable(true);
    // platform.setPushable(false);
    platform.body.allowGravity = false;

    this.physics.add.collider(this.player!, platform);
    this.platforms.push(platform);

    return platform;
  }

  private createPlayer() {
    const player = this.physics.add.image(500, 200, 'dragon');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.setFrictionX(1);

    this.player = player;
  }

  private handleInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (cursors.left.isDown) {
      this.player?.setVelocityX(-this.PLAYER_LEFT_RIGHT_SPEED);
      this.player?.setFlipX(false);
    } else if (cursors.right.isDown) {
      this.player?.setVelocityX(this.PLAYER_LEFT_RIGHT_SPEED);
      this.player?.setFlipX(true);
    } else {
      this.player?.setVelocityX(0);
    }

    if (cursors.up.isDown && this.player?.body.touching.down) {
      this.player?.setVelocityY(-330);
    }
  }
}
