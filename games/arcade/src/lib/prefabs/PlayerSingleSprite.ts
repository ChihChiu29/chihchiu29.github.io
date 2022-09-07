// A basic player that uses a single sprite.
class PlayerSingleSprite extends ArcadePlayerBase {
  private cfg: PlayerProperties;

  constructor(
    scene: Phaser.Scene, imgInitialX: number, imgInitialY: number,
    playerData: PlayerProperties,
  ) {
    super(scene, imgInitialX, imgInitialY);
    this.cfg = playerData;
  }

  override init(): void {
    super.init();

    // Head.
    const headSprite = this.scene.physics.add.sprite(0, 0, this.cfg!.spriteKey!, this.cfg!.spriteFrame);
    headSprite.setCollideWorldBounds(true);
    headSprite.setBounce(0);
    headSprite.setFrictionX(1);
    headSprite.setDisplaySize(this.cfg!.size * 0.95, this.cfg!.size * 0.95);
    this.setMainImage(headSprite);

    if (this.cfg!.hasSpongeEffect) {
      this.addInfiniteTween({
        targets: headSprite,
        displayWidth: this.cfg!.size,
        displayHeight: this.cfg!.size,
        duration: 200,
        yoyo: true,
        loop: -1,
      });
    }
  }

  protected override whenMovingLeftRight(direction: string, isDashing: boolean): void {
    this.maybeActOnMainImg((img) => {
      if (direction === this.INPUT_TYPE.LEFT) {
        img.setFlipX(!this.cfg!.facingLeft!);
      } else if (direction === this.INPUT_TYPE.RIGHT) {
        img.setFlipX(this.cfg!.facingLeft!);
      }
    });
  }
}
