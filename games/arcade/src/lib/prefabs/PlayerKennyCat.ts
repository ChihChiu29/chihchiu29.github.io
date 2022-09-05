class PlayerKennyCat extends ArcadePlatformPlayer {
  HEAD_IMAGE = 'scared';
  HEAD_IMAGE_SIZE = 32;
  SPRITESHEET_NAME = 'tile_characters';
  ANIME_RUN = 'PlayerKennyCat_run';
  ANIME_STOP = 'PlayerKennyCat_stop';

  // The sprite for the leg movement.
  private legSprite?: Phaser.GameObjects.Sprite;

  override init(): void {
    super.init();
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
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.maybeActOnMainImg((img) => {
      this.legSprite!.x = img.x;
      this.legSprite!.y = img.y + 12;
    });
  }
}
