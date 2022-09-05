class PlayerKennyCat extends QPhaser.ArcadePrefab {
  HEAD_IMAGE = 'scared';
  HEAD_IMAGE_SIZE = 32;
  SPRITESHEET_NAME = 'tile_characters';
  ANIME_RUN = 'PlayerKennyCat_run';
  ANIME_STOP = 'PlayerKennyCat_run';

  TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
  TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;

  public playerLeftRightSpeed = 160;
  public playerJumpSpeed = 350;
  public playerFallSpeed = 100;

  // The sprite for the leg movement.
  private legSprite?: Phaser.GameObjects.Sprite;

  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  override init(): void {
    // Leg.
    const legSprite = this.scene.add.sprite(0, 0, this.SPRITESHEET_NAME);
    legSprite.setSize(this.HEAD_IMAGE_SIZE, this.HEAD_IMAGE_SIZE);
    this.add(legSprite);

    this.scene.anims.create({
      key: this.ANIME_RUN,
      frames: this.scene.anims.generateFrameNumbers(this.SPRITESHEET_NAME, { start: 6, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.anims.create({
      key: this.ANIME_STOP,
      frames: [{ key: this.SPRITESHEET_NAME, frame: 4 }],
      frameRate: 10,
      repeat: -1
    });

    legSprite.anims.play(this.ANIME_RUN, true);

    this.legSprite = legSprite;

    // Head.
    const headSprite = this.scene.physics.add.sprite(0, 0, this.HEAD_IMAGE);
    headSprite.setCollideWorldBounds(true);
    headSprite.setBounce(0);
    headSprite.setFrictionX(1);
    // First change the physics body by raw size.
    headSprite.setSize(headSprite.width, headSprite.height * 1.3);
    // Then change the display size and body size.
    headSprite.setDisplaySize(this.HEAD_IMAGE_SIZE, this.HEAD_IMAGE_SIZE);
    // Shifts body down a bit to cover the leg.
    headSprite.setOffset(0, 16);
    this.setMainImage(headSprite);

    this.addInfiniteTween({
      targets: headSprite,
      displayWidth: this.HEAD_IMAGE_SIZE * 1.05,
      displayHeight: this.HEAD_IMAGE_SIZE * 1.05,
      duration: 200,
      yoyo: true,
      loop: -1,
    });

    // Input.
    this.keys = QUI.createKeyMap(this.scene);
    this.scene.input.addPointer(3);  // needs at most 3 touch points (most 2 are valid).
  }

  override update(time: number, delta: number) {
    this.maybeActOnMainImg((img) => {
      this.handleInput(img);
      this.legSprite!.x = img.x;
      this.legSprite!.y = img.y + 12;
    });
  }

  private handleInput(img: Phaser.Physics.Arcade.Sprite) {
    // First get user intention.
    // Keyboard based control.
    let moveLeft = this.keys.A.isDown;
    let moveRight = this.keys.D.isDown;
    let moveUp = this.keys.W.isDown;
    // Touch screen based control.
    for (const ptr of [
      this.scene.input.pointer1,
      this.scene.input.pointer2,
      this.scene.input.pointer3,
      this.scene.input.pointer4]) {
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
      img.setVelocityX(-this.playerLeftRightSpeed);
      img.setFlipX(false);
    } else if (moveRight) {
      img.setVelocityX(this.playerLeftRightSpeed);
      img.setFlipX(true);
    } else {
      img.setVelocityX(0);
    }

    if (moveUp && img.body.touching.down) {
      img.setVelocityY(-this.playerJumpSpeed);
    }
  }
}
