// A player that uses spritesheets for animation.
class PlayerAnimatedSprite extends ArcadePlayerBase {
  private imageKey = '';
  private imageFrame = 0;
  private imageInitialSize = 32;
  private hasSpongeEffect = false;

  constructor(
    scene: Phaser.Scene, imgInitialX: number, imgInitialY: number,
    spriteKey: string = 'scared', spriteFrame: number = 0,
    imageInitialSize: number = 32,
    // whether the sprite would vary a bit in size periodically.
    hasSpongeEffect: boolean = false,
  ) {
    super(scene, imgInitialX, imgInitialY);
    this.imageKey = spriteKey;
    this.imageFrame = spriteFrame;
    this.imageInitialSize = imageInitialSize;
    this.hasSpongeEffect = hasSpongeEffect;
  }

  override init(): void {
    super.init();

    // Head.
    const headSprite = this.scene.physics.add.sprite(0, 0, this.imageKey, this.imageFrame);
    headSprite.setCollideWorldBounds(true);
    headSprite.setBounce(0);
    headSprite.setFrictionX(1);
    headSprite.setDisplaySize(this.imageInitialSize * 0.95, this.imageInitialSize * 0.95);
    this.setMainImage(headSprite);

    if (this.hasSpongeEffect) {
      this.addInfiniteTween({
        targets: headSprite,
        displayWidth: this.imageInitialSize,
        displayHeight: this.imageInitialSize,
        duration: 200,
        yoyo: true,
        loop: -1,
      });
    }
  }
}