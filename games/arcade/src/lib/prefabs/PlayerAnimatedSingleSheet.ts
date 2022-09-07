// A player with all animations from the same spritesheet.
class PlayerAnimatedSingleSheet extends ArcadePlayerBase {
  private ANIME_KEY = {
    STILL: 'PlayerAnimatedSingleSheet_STILL',
    RUN: 'PlayerAnimatedSingleSheet_RUN',
    JUMP: 'PlayerAnimatedSingleSheet_JUMP',
    DASH: 'PlayerAnimatedSingleSheet_DASH',
  }

  private cfg: PlayerProperties;

  private bloatEffect = new QPhaser.SingletonTween();

  constructor(
    scene: Phaser.Scene, imgInitialX: number, imgInitialY: number,
    playerData: PlayerProperties,
  ) {
    super(scene, imgInitialX, imgInitialY);
    this.cfg = playerData;
  }

  override init(): void {
    super.init();

    const spritesheetKey = this.cfg!.spritesheetKey!;
    const frameRate = this.cfg!.frameRate!;

    const player = this.scene.physics.add.sprite(0, 0, spritesheetKey, this.cfg!.frameStill);
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    player.setFrictionX(1);
    player.setDisplaySize(this.cfg!.size, this.cfg!.size);
    this.setMainImage(player);

    this.scene.anims.create({
      key: this.ANIME_KEY.STILL,
      frames: [{ key: spritesheetKey, frame: this.cfg!.frameStill }],
      frameRate: frameRate,
      repeat: -1
    });

    this.scene.anims.create({
      key: this.ANIME_KEY.RUN,
      frames: this.scene.anims.generateFrameNumbers(
        spritesheetKey,
        { start: this.cfg!.frameRunStart, end: this.cfg!.frameRunEnd }),
      frameRate: frameRate,
      repeat: -1
    });

    this.scene.anims.create({
      key: this.ANIME_KEY.JUMP,
      frames: this.scene.anims.generateFrameNumbers(
        spritesheetKey,
        { start: this.cfg!.frameJumpStart, end: this.cfg!.frameJumpEnd }),
      frameRate: frameRate,
      repeat: -1
    });
  }

  protected override takeExtraActionsDuringUpdate(
    direction: string,
    isDashing: boolean,
    inAir: boolean,
    isJumping: boolean,
  ): void {
    this.maybeActOnMainImg((img) => {
      if (direction !== this.INPUT_TYPE.NEUTRAL) {
        if (inAir) {
          img.play(this.ANIME_KEY.JUMP);
        } else {
          img.play(this.ANIME_KEY.RUN);
        }
        if (this.cfg!.spritesheetFacingLeft!) {
          img.setFlipX(direction === this.INPUT_TYPE.RIGHT);
        } else {
          img.setFlipX(direction === this.INPUT_TYPE.LEFT);
        }
      } else {
        img.play(this.ANIME_KEY.STILL);
      }

      if (isJumping) {
        img.setDisplaySize(this.cfg!.size, this.cfg!.size);
        this.bloatEffect.update(this.scene.add.tween({
          targets: img,
          displayWidth: this.cfg!.size * 1.5,
          displayHeight: this.cfg!.size * 1.5,
          duration: 150,
          yoyo: true,
          loop: false,
        }));
      }
    });
  }
}
